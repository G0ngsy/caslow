import unittest
from datetime import date

from date_utils import month_range, shift_month, trailing_months, validate_year_month


class DateUtilsTest(unittest.TestCase):
    def test_month_range_crosses_year_boundary(self):
        self.assertEqual(month_range(2026, 12), (date(2026, 12, 1), date(2027, 1, 1)))

    def test_shift_month_crosses_both_year_boundaries(self):
        self.assertEqual(shift_month(2026, 12, 1), (2027, 1))
        self.assertEqual(shift_month(2026, 1, -1), (2025, 12))

    def test_trailing_months_are_continuous(self):
        self.assertEqual(
            trailing_months(2026, 2, 6),
            [(2025, 9), (2025, 10), (2025, 11), (2025, 12), (2026, 1), (2026, 2)],
        )

    def test_invalid_month_is_rejected(self):
        with self.assertRaises(ValueError):
            validate_year_month(2026, 13)

    def test_invalid_count_is_rejected(self):
        with self.assertRaises(ValueError):
            trailing_months(2026, 8, 0)


if __name__ == "__main__":
    unittest.main()
