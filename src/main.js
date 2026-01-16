import * as app from "./app.js"
import * as storageMigration from "./storage-migration.js";
import * as catalogAccess from "./catalog/catalog-load.js";

window.addEventListener("load", () => {
    catalogAccess.invalidateCache();
    storageMigration.performStorageMigration();
});

await app.init();