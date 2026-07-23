import { describe, it, expect } from "vitest";
import { buildProfileArgs, splitVerifyArgs } from "../util/args";

describe("buildProfileArgs", () => {
    it("returns empty array when neither name nor version is provided", () => {
        expect(buildProfileArgs("", "")).toEqual([]);
    });

    it("builds --set flag for profile name only", () => {
        expect(buildProfileArgs("community", "")).toEqual([
            "--set", "profile.vendortype=community",
        ]);
    });

    it("builds --set flag for profile version only", () => {
        expect(buildProfileArgs("", "1.1")).toEqual([
            "--set", "profile.version=1.1",
        ]);
    });

    it("builds --set flags for both name and version", () => {
        expect(buildProfileArgs("community", "1.1")).toEqual([
            "--set", "profile.vendortype=community",
            "--set", "profile.version=1.1",
        ]);
    });
});

describe("splitVerifyArgs", () => {
    it("returns empty array for empty string", () => {
        expect(splitVerifyArgs("")).toEqual([]);
    });

    it("returns empty array for whitespace-only string", () => {
        expect(splitVerifyArgs("   ")).toEqual([]);
    });

    it("splits a single argument", () => {
        expect(splitVerifyArgs("--flag")).toEqual(["--flag"]);
    });

    it("splits multiple arguments", () => {
        expect(splitVerifyArgs("--flag1 --flag2 value")).toEqual([
            "--flag1", "--flag2", "value",
        ]);
    });

    it("handles leading, trailing, and multiple internal spaces", () => {
        expect(splitVerifyArgs("  --a   --b  ")).toEqual(["--a", "--b"]);
    });
});
