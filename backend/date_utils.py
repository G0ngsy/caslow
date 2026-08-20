from datetime import date
from typing import List, Tuple


def validate_year_month(year: int, month: int) -> None:
    if year < 1900 or year > 2100:
        raise ValueError("year 범위가 올바르지 않습니다.")
    if month < 1 or month > 12:
        raise ValueError("month는 1~12 사이여야 합니다.")


def month_range(year: int, month: int) -> Tuple[date, date]:
    validate_year_month(year, month)
    start = date(year, month, 1)
    end = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)
    return start, end


def shift_month(year: int, month: int, offset: int) -> Tuple[int, int]:
    validate_year_month(year, month)
    zero_based = year * 12 + month - 1 + offset
    shifted_year, shifted_month = divmod(zero_based, 12)
    validate_year_month(shifted_year, shifted_month + 1)
    return shifted_year, shifted_month + 1


def trailing_months(year: int, month: int, count: int = 6) -> List[Tuple[int, int]]:
    if count < 1:
        raise ValueError("count는 1 이상이어야 합니다.")
    return [shift_month(year, month, offset) for offset in range(-(count - 1), 1)]
