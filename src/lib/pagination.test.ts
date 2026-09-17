/**
 * @file Unit tests for pagination query-parameter parsers and the pagination
 * loader configuration.
 *
 * Covers:
 * - `parseAsBoundedInteger`: factory producing a parser that clamps integers
 *   to a given [min, max] range.
 * - `parseAsPage`: parser for the "page" query parameter (1-based, min 1).
 * - `parseAsPageSize`: parser for the "pageSize" query parameter, clamped to
 *   [PAGINATION.MIN_PAGE_SIZE, PAGINATION.MAX_PAGE_SIZE].
 * - `paginationParams`: factory returning the `nuqs` parser map used to build
 *   a search-params loader for pagination state.
 */

import assert from "node:assert"
import { describe, it } from "node:test"
import { createLoader } from "nuqs/server"

import { PAGINATION } from "@/config/constants"

import {
  paginationParams,
  parseAsBoundedInteger,
  parseAsPage,
  parseAsPageSize,
} from "./pagination"

describe("pagination", () => {
  describe("parseAsBoundedInteger", () => {
    /** Bounds used to exercise the parser factory in this suite. */
    const MIN = 5
    const MAX = 15
    const parser = parseAsBoundedInteger(MIN, MAX)

    it("parses valid integers within the bounds", () => {
      assert.strictEqual(parser.parse(String(MIN)), MIN)
      assert.strictEqual(parser.parse("10"), 10)
      assert.strictEqual(parser.parse(String(MAX)), MAX)
    })

    it("clamps values below min to min", () => {
      for (const input of ["4", "0", "-10"]) {
        assert.strictEqual(parser.parse(input), MIN)
      }
    })

    it("clamps values above max to max", () => {
      for (const input of ["16", "100"]) {
        assert.strictEqual(parser.parse(input), MAX)
      }
    })

    it("returns null for non-integer or invalid input", () => {
      for (const input of ["abc", "", "   ", "NaN"]) {
        assert.strictEqual(parser.parse(input), null)
      }
    })

    it("serializes numbers to string", () => {
      assert.strictEqual(parser.serialize(10), "10")
      assert.strictEqual(parser.serialize(0), "0")
      assert.strictEqual(parser.serialize(-5), "-5")
    })
  })

  describe("parseAsPage", () => {
    it("parses valid page numbers", () => {
      for (const [input, expected] of [
        ["1", 1],
        ["2", 2],
        ["42", 42],
        ["99999", 99999],
      ] as const) {
        assert.strictEqual(parseAsPage.parse(input), expected)
      }
    })

    it("clamps page values < 1 up to 1", () => {
      for (const input of ["0", "-1", "-999"]) {
        assert.strictEqual(parseAsPage.parse(input), 1)
      }
    })

    it("returns null for non-numeric input", () => {
      for (const input of ["foo", ""]) {
        assert.strictEqual(parseAsPage.parse(input), null)
      }
    })

    it("serializes page numbers", () => {
      assert.strictEqual(parseAsPage.serialize(3), "3")
    })
  })

  describe("parseAsPageSize", () => {
    it("parses valid pageSize within [MIN_PAGE_SIZE, MAX_PAGE_SIZE]", () => {
      for (const [input, expected] of [
        ["1", 1],
        ["10", 10],
        ["50", 50],
        ["100", 100],
      ] as const) {
        assert.strictEqual(parseAsPageSize.parse(input), expected)
      }
    })

    it("clamps pageSize below MIN_PAGE_SIZE (1) up to MIN_PAGE_SIZE", () => {
      for (const input of ["0", "-5"]) {
        assert.strictEqual(
          parseAsPageSize.parse(input),
          PAGINATION.MIN_PAGE_SIZE
        )
      }
    })

    it("clamps pageSize above MAX_PAGE_SIZE (100) down to MAX_PAGE_SIZE", () => {
      for (const input of ["101", "500"]) {
        assert.strictEqual(
          parseAsPageSize.parse(input),
          PAGINATION.MAX_PAGE_SIZE
        )
      }
    })

    it("returns null for non-numeric input", () => {
      for (const input of ["bar", ""]) {
        assert.strictEqual(parseAsPageSize.parse(input), null)
      }
    })

    it("serializes pageSize numbers", () => {
      assert.strictEqual(parseAsPageSize.serialize(25), "25")
    })
  })

  describe("paginationParams", () => {
    it("provides page and pageSize with correct default values and options", () => {
      const params = paginationParams()

      assert.strictEqual(params.page.defaultValue, PAGINATION.DEFAULT_PAGE)
      assert.strictEqual(params.page.clearOnDefault, true)

      assert.strictEqual(
        params.pageSize.defaultValue,
        PAGINATION.DEFAULT_PAGE_SIZE
      )
      assert.strictEqual(params.pageSize.clearOnDefault, true)
    })

    it("normalizes out-of-range values via loader", () => {
      const loader = createLoader(paginationParams())

      /**
       * Table of raw search-param inputs and the normalized output expected
       * from the loader, covering both `page` and `pageSize` bounds
       * enforcement.
       */
      const cases = [
        // page bounds enforcement
        {
          input: { page: "0" },
          expected: { page: 1, pageSize: PAGINATION.DEFAULT_PAGE_SIZE },
        },
        {
          input: { page: "-5" },
          expected: { page: 1, pageSize: PAGINATION.DEFAULT_PAGE_SIZE },
        },
        {
          input: { page: "4" },
          expected: { page: 4, pageSize: PAGINATION.DEFAULT_PAGE_SIZE },
        },
        // pageSize bounds enforcement
        {
          input: { pageSize: "0" },
          expected: {
            page: PAGINATION.DEFAULT_PAGE,
            pageSize: PAGINATION.MIN_PAGE_SIZE,
          },
        },
        {
          input: { pageSize: "-10" },
          expected: {
            page: PAGINATION.DEFAULT_PAGE,
            pageSize: PAGINATION.MIN_PAGE_SIZE,
          },
        },
        {
          input: { pageSize: "101" },
          expected: {
            page: PAGINATION.DEFAULT_PAGE,
            pageSize: PAGINATION.MAX_PAGE_SIZE,
          },
        },
        {
          input: { pageSize: "200" },
          expected: {
            page: PAGINATION.DEFAULT_PAGE,
            pageSize: PAGINATION.MAX_PAGE_SIZE,
          },
        },
        {
          input: { pageSize: "25" },
          expected: { page: PAGINATION.DEFAULT_PAGE, pageSize: 25 },
        },
      ]

      for (const { input, expected } of cases) {
        assert.deepStrictEqual(loader(input), expected)
      }
    })

    it("falls back to default values when input is missing or invalid", () => {
      const loader = createLoader(paginationParams())

      assert.deepStrictEqual(loader({}), {
        page: PAGINATION.DEFAULT_PAGE,
        pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
      })
      assert.deepStrictEqual(
        loader({ page: "invalid", pageSize: "not-a-number" }),
        {
          page: PAGINATION.DEFAULT_PAGE,
          pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
        }
      )
    })
  })
})
