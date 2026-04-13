# GraphRAG 엔진
# NetworkX를 사용해서 지출 데이터를 그래프로 구성하고
# 유저 질문과 관련된 노드를 탐색해서 컨텍스트를 생성해요

import networkx as nx
from collections import defaultdict
from datetime import date, datetime
from typing import Any

class CaslowGraphRAG:
    def __init__(self):
        # 방향 그래프 생성
        self.graph = nx.DiGraph()

    def build_graph(self, expenses: list, goals: list, recurring: list):
        """
        지출/목표/정기지출 데이터로 그래프 구성
        """
        self.graph.clear()

        # 카테고리별 지출 집계
        category_totals = defaultdict(int)
        category_counts = defaultdict(int)
        monthly_totals = defaultdict(int)

        # ── 지출 노드 추가 ──
        for e in expenses:
            expense_id = f"expense_{e['id']}"
            category = e.get('category', '기타')
            month = str(e.get('date', ''))[:7]  # "2026-04"

            # 지출 노드
            self.graph.add_node(expense_id,
                type='expense',
                title=e.get('title', ''),
                amount=e.get('amount', 0),
                category=category,
                date=str(e.get('date', '')),
                memo=e.get('memo', ''),
            )

            # 카테고리 노드
            cat_id = f"category_{category}"
            if not self.graph.has_node(cat_id):
                self.graph.add_node(cat_id, type='category', name=category)

            # 날짜 노드
            date_id = f"date_{month}"
            if not self.graph.has_node(date_id):
                self.graph.add_node(date_id, type='date', month=month)

            # 엣지 연결
            self.graph.add_edge(expense_id, cat_id, relation='belongs_to')
            self.graph.add_edge(expense_id, date_id, relation='occurred_on')

            # 집계
            category_totals[category] += e.get('amount', 0)
            category_counts[category] += 1
            monthly_totals[month] += e.get('amount', 0)

        # ── 패턴 노드 추가 ──
        total_amount = sum(category_totals.values())
        for category, amount in category_totals.items():
            cat_id = f"category_{category}"
            ratio = (amount / total_amount * 100) if total_amount > 0 else 0

            # 지출 비율이 30% 이상이면 과소비 패턴
            if ratio >= 30:
                pattern_id = f"pattern_{category}_overspend"
                self.graph.add_node(pattern_id,
                    type='pattern',
                    name=f"{category} 과소비",
                    category=category,
                    amount=amount,
                    ratio=round(ratio, 1),
                )
                self.graph.add_edge(cat_id, pattern_id, relation='has_pattern')

        # ── 목표 노드 추가 ──
        for g in goals:
            goal_id = f"goal_{g['id']}"
            percent = round((g.get('current_amount', 0) / g.get('target_amount', 1)) * 100)
            self.graph.add_node(goal_id,
                type='goal',
                title=g.get('title', ''),
                target_amount=g.get('target_amount', 0),
                current_amount=g.get('current_amount', 0),
                percent=percent,
                goal_type=g.get('type', ''),
                deadline=str(g.get('deadline', '')),
            )

            # 달성률 낮으면 과소비 패턴과 연결
            if percent < 50:
                for node, data in self.graph.nodes(data=True):
                    if data.get('type') == 'pattern':
                        self.graph.add_edge(node, goal_id, relation='exceeds_budget')

        # ── 정기 지출 노드 추가 ──
        for r in recurring:
            recurring_id = f"recurring_{r['id']}"
            self.graph.add_node(recurring_id,
                type='recurring',
                title=r.get('title', ''),
                amount=r.get('amount', 0),
                category=r.get('category', ''),
                day_of_month=r.get('day_of_month', 1),
            )

            # 카테고리 노드와 연결
            cat_id = f"category_{r.get('category', '기타')}"
            if self.graph.has_node(cat_id):
                self.graph.add_edge(recurring_id, cat_id, relation='recurs_monthly')

    def search(self, query: str) -> str:
        """
        질문 키워드 기반으로 관련 노드 탐색 후 컨텍스트 생성
        """
        context_parts = []
        query_lower = query.lower()

        # ── 키워드 기반 관련 노드 탐색 ──
        for node, data in self.graph.nodes(data=True):
            node_type = data.get('type')

            # 지출 노드
            if node_type == 'expense':
                if any(kw in query_lower for kw in [
                    '지출', '썼', '썼어', '얼마', '내역', '소비',
                    data.get('category', '').lower(),
                    data.get('title', '').lower(),
                ]):
                    context_parts.append(
                        f"[지출] {data['date']} {data['title']} "
                        f"({data['category']}): {data['amount']:,}원"
                    )

            # 패턴 노드
            elif node_type == 'pattern':
                if any(kw in query_lower for kw in [
                    '패턴', '분석', '많이', '과소비', '줄이', '절약',
                    data.get('category', '').lower(),
                ]):
                    context_parts.append(
                        f"[패턴] {data['name']}: {data['amount']:,}원 "
                        f"(전체의 {data['ratio']}%)"
                    )

            # 목표 노드
            elif node_type == 'goal':
                if any(kw in query_lower for kw in [
                    '목표', '저축', '달성', '얼마나', '남았',
                    data.get('title', '').lower(),
                ]):
                    context_parts.append(
                        f"[목표] {data['title']}: "
                        f"{data['current_amount']:,}원 / {data['target_amount']:,}원 "
                        f"({data['percent']}% 달성)"
                    )

            # 정기 지출 노드
            elif node_type == 'recurring':
                if any(kw in query_lower for kw in [
                    '정기', '구독', '고정', '월세', '매월',
                    data.get('title', '').lower(),
                ]):
                    context_parts.append(
                        f"[정기지출] {data['title']}: "
                        f"매월 {data['day_of_month']}일 {data['amount']:,}원"
                    )

        # 컨텍스트가 없으면 전체 요약 반환
        if not context_parts:
            context_parts = self._get_summary()

        return "\n".join(context_parts[:20])  # 최대 20개

    def _get_summary(self) -> list:
        """전체 지출 요약 반환"""
        summary = []
        total = 0
        category_totals = defaultdict(int)

        for node, data in self.graph.nodes(data=True):
            if data.get('type') == 'expense':
                total += data.get('amount', 0)
                category_totals[data.get('category', '기타')] += data.get('amount', 0)

        if total > 0:
            summary.append(f"[요약] 총 지출: {total:,}원")
            for cat, amount in sorted(category_totals.items(), key=lambda x: -x[1]):
                summary.append(f"  - {cat}: {amount:,}원")

        return summary if summary else ["지출 데이터가 없습니다."]