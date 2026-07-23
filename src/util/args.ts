export function buildProfileArgs(profileName: string, profileVersion: string): string[] {
    const args: string[] = [];
    if (profileName) {
        args.push("--set", `profile.vendortype=${profileName}`);
    }
    if (profileVersion) {
        args.push("--set", `profile.version=${profileVersion}`);
    }
    return args;
}

export function splitVerifyArgs(verifyArgs: string): string[] {
    const trimmed = verifyArgs.trim();
    if (trimmed === "") {
        return [];
    }
    return trimmed.split(/\s+/);
}
