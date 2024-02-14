class CrateDocManager {
    static async getCrates() {
        return await storage.getItem("crates") || {};
    }

    // The `name` cloud be crateName or libName.
    static async getCrateByName(name) {
        let crates = await CrateDocManager.getCrates();
        if (crates[name]) {
            return crates[name];
        } else {
            let crate = Object.entries(crates).find(([_, { crateName }]) => crateName == name);
            if (crate) {
                return crate[1];
            } else {
                return null;
            }
        }
    }

    // The `name` cloud be crateName or libName.
    static async getCrateSearchIndex(name) {
        let searchIndex = await storage.getItem(`@${name}`);
        if (searchIndex) {
            return searchIndex;
        } else {
            let crates = await CrateDocManager.getCrates();
            let crate = Object.entries(crates).find(([_, { crateName }]) => crateName == name);
            if (crate) {
                let libName = crate[0];
                return await storage.getItem(`@${libName}`);
            } else {
                return null;
            }
        }
    }

    // Some corner cases the crateName different to libName:
    // 1. https://docs.rs/actix-web/3.2.0/actix_web/
    // 2. https://docs.rs/md-5/0.10.5/md5/
    // 
    // Here is the rule: https://docs.rs/{crateName}/{crateVersion}/{libName}
    static async addCrate({ libName, crateVersion, searchIndex, crateName }) {
        if (searchIndex && (libName in searchIndex || searchIndex.has(libName))) {
            // Do not use typeof, since typeof new Map() is "object".
            if (searchIndex instanceof Map) {
                // Convert Map to Object
                await storage.setItem(`@${libName}`, Object.fromEntries(searchIndex));
            } else {
                await storage.setItem(`@${libName}`, searchIndex);
            }
            let crate = searchIndex[libName] || searchIndex.get(libName);
            let doc = crate["doc"];
            let crates = await CrateDocManager.getCrates();
            if (libName in crates) {
                // Don't override the time if the crate exists
                crates[libName] = { version: crateVersion, doc, time: crates[libName].time, crateName };
            } else {
                crates[libName] = { version: crateVersion, doc, time: Date.now(), crateName };
            }
            await storage.setItem("crates", crates);
        }
    }

    static async removeCrate(name) {
        let crates = await CrateDocManager.getCrates();
        delete crates[name];
        await storage.setItem("crates", crates);
        await storage.removeItem(`@${name}`);
    }
}