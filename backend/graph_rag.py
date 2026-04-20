# Neo4j를 사용해서 지출 데이터를 그래프 DB에 영구 저장하고
# 유저 질문과 관련된 노드를 탐색해서 컨텍스트를 생성해요

import os
from collections import defaultdict
from neo4j import GraphDatabase
from dotenv import load_dotenv

load_dotenv()

class CaslowGraphRAG:
    def __init__(self):
        # Neo4j Aura 연결
        self.driver = GraphDatabase.driver(
            os.getenv("NEO4J_URI"),
            auth=(
                os.getenv("NEO4J_USERNAME"),
                os.getenv("NEO4J_PASSWORD")
            )
        )

    def close(self):
        # 드라이버 종료 (앱 종료 시 호출)
        self.driver.close()

    def _run(self, query: str, params: dict = {}):
        # Cypher 쿼리 실행 헬퍼 함수
        with self.driver.session() as session:
            return session.run(query, params).data()

    # ────────────────────────────────────────
    # 그래프 초기화 + 구성
    # ────────────────────────────────────────

    def build_graph(self, expenses: list, goals: list, recurring: list):
        """
        지출/목표/정기지출 데이터로 Neo4j 그래프 구성
        기존 데이터 전체 삭제 후 재구성
        """
        # 기존 노드/엣지 전체 삭제
        self._run("MATCH (n) DETACH DELETE n")

        # 카테고리별 집계 (패턴 노드 생성용)
        category_totals = defaultdict(int)
        total_amount = sum(e.get('amount', 0) for e in expenses)

        # ── 지출 노드 추가 ──
        for e in expenses:
            category = e.get('category', '기타')
            month = str(e.get('date', ''))[:7]  # "2026-04"
            category_totals[category] += e.get('amount', 0)

            # 지출 노드 생성
            self._run("""
                MERGE (e:Expense {id: $id})
                SET e.title    = $title,
                    e.amount   = $amount,
                    e.category = $category,
                    e.date     = $date,
                    e.memo     = $memo

                MERGE (c:Category {name: $category})

                MERGE (d:DateNode {month: $month})

                MERGE (e)-[:BELONGS_TO]->(c)
                MERGE (e)-[:OCCURRED_ON]->(d)
            """, {
                "id":       str(e['id']),
                "title":    e.get('title', ''),
                "amount":   e.get('amount', 0),
                "category": category,
                "date":     str(e.get('date', '')),
                "memo":     e.get('memo', ''),
                "month":    month,
            })

        # ── 패턴 노드 추가 (30% 이상 = 과소비) ──
        for category, amount in category_totals.items():
            ratio = (amount / total_amount * 100) if total_amount > 0 else 0
            if ratio >= 30:
                self._run("""
                    MERGE (c:Category {name: $category})
                    MERGE (p:Pattern {name: $name})
                    SET p.category = $category,
                        p.amount   = $amount,
                        p.ratio    = $ratio
                    MERGE (c)-[:HAS_PATTERN]->(p)
                """, {
                    "category": category,
                    "name":     f"{category} 과소비",
                    "amount":   amount,
                    "ratio":    round(ratio, 1),
                })

        # ── 목표 노드 추가 ──
        for g in goals:
            percent = round(
                (g.get('current_amount', 0) / g.get('target_amount', 1)) * 100
            )
            self._run("""
                MERGE (g:Goal {id: $id})
                SET g.title          = $title,
                    g.target_amount  = $target_amount,
                    g.current_amount = $current_amount,
                    g.percent        = $percent,
                    g.deadline       = $deadline
            """, {
                "id":             str(g['id']),
                "title":          g.get('title', ''),
                "target_amount":  g.get('target_amount', 0),
                "current_amount": g.get('current_amount', 0),
                "percent":        percent,
                "deadline":       str(g.get('deadline', '')),
            })

            # 달성률 50% 미만이면 과소비 패턴과 연결
            if percent < 50:
                self._run("""
                    MATCH (p:Pattern)
                    MATCH (g:Goal {id: $id})
                    MERGE (p)-[:EXCEEDS_BUDGET]->(g)
                """, {"id": str(g['id'])})

        # ── 정기 지출 노드 추가 ──
        for r in recurring:
            self._run("""
                MERGE (r:Recurring {id: $id})
                SET r.title        = $title,
                    r.amount       = $amount,
                    r.category     = $category,
                    r.day_of_month = $day_of_month

                MERGE (c:Category {name: $category})
                MERGE (r)-[:RECURS_MONTHLY]->(c)
            """, {
                "id":           str(r['id']),
                "title":        r.get('title', ''),
                "amount":       r.get('amount', 0),
                "category":     r.get('category', '기타'),
                "day_of_month": r.get('day_of_month', 1),
            })

    # ────────────────────────────────────────
    # 질문 기반 노드 탐색 → 컨텍스트 생성
    # ────────────────────────────────────────

    def search(self, query: str) -> str:
        """
        질문 키워드 기반으로 Neo4j에서 관련 노드 탐색 후 컨텍스트 생성
        """
        context_parts = []
        q = query.lower()

        # ── 지출 내역 관련 질문 ──
        if any(kw in q for kw in ['지출', '썼', '얼마', '내역', '소비', '샀']):
            rows = self._run("""
                MATCH (e:Expense)-[:BELONGS_TO]->(c:Category)
                RETURN e.date    AS date,
                       e.title   AS title,
                       c.name    AS category,
                       e.amount  AS amount
                ORDER BY e.date DESC
                LIMIT 10
            """)
            for r in rows:
                context_parts.append(
                    f"[지출] {r['date']} {r['title']} "
                    f"({r['category']}): {r['amount']:,}원"
                )

        # ── 패턴/과소비 관련 질문 ──
        if any(kw in q for kw in ['패턴', '분석', '많이', '과소비', '줄이', '절약']):
            rows = self._run("""
                MATCH (c:Category)-[:HAS_PATTERN]->(p:Pattern)
                RETURN p.name   AS name,
                       p.amount AS amount,
                       p.ratio  AS ratio
            """)
            for r in rows:
                context_parts.append(
                    f"[패턴] {r['name']}: {r['amount']:,}원 "
                    f"(전체의 {r['ratio']}%)"
                )

        # ── 목표 관련 질문 ──
        if any(kw in q for kw in ['목표', '저축', '달성', '남았', '얼마나']):
            rows = self._run("""
                MATCH (g:Goal)
                RETURN g.title          AS title,
                       g.current_amount AS current,
                       g.target_amount  AS target,
                       g.percent        AS percent,
                       g.deadline       AS deadline
            """)
            for r in rows:
                context_parts.append(
                    f"[목표] {r['title']}: "
                    f"{r['current']:,}원 / {r['target']:,}원 "
                    f"({r['percent']}% 달성, 마감: {r['deadline']})"
                )

        # ── 정기 지출 관련 질문 ──
        if any(kw in q for kw in ['정기', '구독', '고정', '월세', '매월']):
            rows = self._run("""
                MATCH (r:Recurring)-[:RECURS_MONTHLY]->(c:Category)
                RETURN r.title        AS title,
                       r.amount       AS amount,
                       r.day_of_month AS day,
                       c.name         AS category
            """)
            for r in rows:
                context_parts.append(
                    f"[정기지출] {r['title']} ({r['category']}): "
                    f"매월 {r['day']}일 {r['amount']:,}원"
                )

        # ── 컨텍스트 없으면 전체 요약 반환 ──
        if not context_parts:
            context_parts = self._get_summary()

        return "\n".join(context_parts[:20])  # 최대 20개

    # ────────────────────────────────────────
    # 전체 요약
    # ────────────────────────────────────────

    def _get_summary(self) -> list:
        """전체 지출 요약 반환"""
        summary = []

        # 총 지출
        total_row = self._run("""
            MATCH (e:Expense)
            RETURN sum(e.amount) AS total
        """)
        total = total_row[0]['total'] if total_row else 0

        if total:
            summary.append(f"[요약] 총 지출: {total:,}원")

            # 카테고리별 합계
            cat_rows = self._run("""
                MATCH (e:Expense)-[:BELONGS_TO]->(c:Category)
                RETURN c.name       AS category,
                       sum(e.amount) AS amount
                ORDER BY amount DESC
            """)
            for r in cat_rows:
                summary.append(f"  - {r['category']}: {r['amount']:,}원")

        return summary if summary else ["지출 데이터가 없습니다."]
    
    
    def sync_expense(self, expense: dict):
        """
        지출 하나만 Neo4j에 추가/업데이트 (전체 재구성 없이)
        지출 저장 시 호출해요
        """
        category = expense.get('category', '기타')
        month = str(expense.get('date', ''))[:7]

        self._run("""
            MERGE (e:Expense {id: $id})
            SET e.title    = $title,
                e.amount   = $amount,
                e.category = $category,
                e.date     = $date,
                e.memo     = $memo

            MERGE (c:Category {name: $category})
            MERGE (d:DateNode {month: $month})
            MERGE (e)-[:BELONGS_TO]->(c)
            MERGE (e)-[:OCCURRED_ON]->(d)
        """, {
            "id":       str(expense['id']),
            "title":    expense.get('title', ''),
            "amount":   expense.get('amount', 0),
            "category": category,
            "date":     str(expense.get('date', '')),
            "memo":     expense.get('memo', ''),
            "month":    month,
        })

    def delete_expense(self, expense_id: str):
        """
        지출 삭제 시 Neo4j에서도 해당 노드 삭제
        """
        self._run("""
            MATCH (e:Expense {id: $id})
            DETACH DELETE e
        """, {"id": str(expense_id)})


# 앱 전체에서 공유하는 싱글톤 인스턴스
# Neo4j 드라이버 연결을 매 요청마다 생성하지 않기 위해 한 번만 생성
try:
    graph_rag = CaslowGraphRAG()
except Exception as e:
    print(f"⚠️ Neo4j 초기화 실패: {e}")
    graph_rag = None