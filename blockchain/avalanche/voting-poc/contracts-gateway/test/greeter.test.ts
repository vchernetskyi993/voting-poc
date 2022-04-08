import assert from "assert";
import { greet } from "../src/greeter";

describe("greet", () => {
  it("should return a greeting statement", () => {
    const actual: string = greet("Bobae");
    const expected: string = "Hello, Bobae!";

    assert.equal(actual, expected);
  });
});
