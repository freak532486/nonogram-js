import { CatalogAccess } from "./catalog/catalog-access";
import { Catalog } from "./catalog/component/catalog.component";
import { Header } from "./header/header.component";
import { Menu } from "./menu/menu.component";
import { NotFoundPage } from "./not-found-page/not-found-page";
import { PlayfieldComponent } from "./playfield/playfield.component";
import { Router } from "./router";
import { StartPage } from "./start-page/component/start-page.component";
import { StartPageNonogramSelector } from "./start-page/internal/start-page-nonogram-selector";
import LoginComponent from "./auth/components/login/login.component"
import AuthService from "./auth/services/auth-service"
import tokenRepositoryInstance from "./auth/services/token-repository-instance"
import ApiServiceImpl from "./api/api-service-impl"
import SavefileMigrator, * as storageMigration from "./savefile/savefile-migrator"
import PlayfieldMenuButtonManager from "./menu/button-managers/playfield-menu-button-manager";
import RegistrationConfirmationManager from "./auth/services/confirm-registration";
import DefaultMenuButtonManager from "./menu/button-managers/default-menu-button-manager";
import SavefileAccess from "./savefile/savefile-access";
import SavefileManager from "./savefile/savefile-manager";
import { getSavestateForNonogram, putSavestate } from "./savefile/savefile-utils";
import Settings from "./settings/index/settings.component";
import MergeLocalSavefileWithAccount from "./savefile/merge-local-savefile-with-account";
import SavefileMerger from "./savefile/savefile-merger";
import SavefileSyncService from "./savefile/savefile-sync-service";

const TITLE_STARTPAGE = "NonoJs · Free Nonogram Platform";
const TITLE_CATALOG = "Looking at catalog";
const TITLE_LOGIN = "Log in to NonoJs";
const TITLE_SETTINGS = "NonoJs · Settings";

const contentRoot = /** @type {HTMLElement} */ (document.getElementById("content-column"));
const headerDiv = /** @type {HTMLElement} */ (document.getElementById("header-div"));
const mainDiv = /** @type {HTMLElement} */ (document.getElementById("main-div"));

const catalogAccess = new CatalogAccess();


export let apiService = new ApiServiceImpl(tokenRepositoryInstance);

/** If undefined, then the user is not logged in */
let activeUsername = /** @type {string | undefined} */ (undefined);

const savefileAccess = new SavefileAccess(apiService, msg => alert(msg), () => activeUsername);
const savefileManager = new SavefileManager(savefileAccess, () => activeUsername);
const savefileMigrator = new SavefileMigrator(savefileAccess);
const savefileMerger = new SavefileMerger();
const savefileSyncService = new SavefileSyncService(savefileAccess, savefileMerger);

/** @type {any} */
let activeComponent = undefined;

let mergeLocalSavefileWithAccount = new MergeLocalSavefileWithAccount(
    savefileAccess,
    savefileMerger,
    () => activeUsername
);

let notFoundPage = new NotFoundPage();
let router = new Router();
let menu = new Menu();
let header = new Header(menu);
let catalog = new Catalog(catalogAccess, savefileAccess);
const startPageNonogramSelector = new StartPageNonogramSelector(catalogAccess, savefileAccess);
let startPage = new StartPage(startPageNonogramSelector, catalogAccess, savefileAccess);
export let registrationManager = new RegistrationConfirmationManager(
    () => mainDiv.replaceChildren(),
    mainDiv
);
let authService = new AuthService(apiService, tokenRepositoryInstance);
let settings = new Settings(
    savefileAccess,
    () => activeUsername,
    async () => {
        await mergeLocalSavefileWithAccount.perform();
        navigateTo("/");
    },
    async () => {
        await authService.deleteUser();
        navigateTo("/");
    }
);

let loginPage = new LoginComponent(
    async (username, password) => {
        const result = await authService.login(username, password);

        switch (result.status) {
            case "ok":
                navigateTo("/");
                break;

            case "bad_credentials":
                loginPage.loginMessage = "Wrong credentials.";
                loginPage.loginMessageColor = "#FF0000";
                break;

            case "error":
                loginPage.loginMessage = "An error occured. Details can be found in the browser console."
                loginPage.loginMessageColor = "#FF0000";
                console.log("An error occured during login.", result.data);
                break;
        }
    },

    async (username, password, emailAddress) => {
        const result = await authService.register(username, password, emailAddress);
        switch (result.status) {
            case "ok":
                loginPage.registerMessage = "A confirmation E-Mail has been sent to your address.";
                loginPage.registerMessageColor = "#3dc41c";
                break;

            case "invalid_auth":
                loginPage.registerMessage = "Username and password must only contain ASCII characters (no emojis, no foreign characters).";
                loginPage.registerMessageColor = "#FF0000";
                break;

            case "user_exists":
                loginPage.registerMessage = "User already exists.";
                loginPage.registerMessageColor = "#FF0000";
                break;

            case "error":
                loginPage.registerMessage = "An error occured. Details can be found in the browser console.";
                loginPage.registerMessageColor = "#FF0000";
                console.error("An error occured during registration.", result.data);
                break;
        }
    }
);

let playfield = /** @type {PlayfieldComponent | undefined} */ (undefined);

/* If undefined, that means the catalog is open */
let openNonogramId = /** @type {string | undefined} */ (undefined);

export async function init() {
    catalogAccess.invalidateCache();
    
    activeUsername = await authService.getCurrentUsername();
    await savefileManager.initializeLocalSavefile();
    savefileMigrator.performStorageMigration();

    await menu.init(contentRoot);
    await header.init(headerDiv);

    const defaultMenuButtonManager = new DefaultMenuButtonManager(
        menu,
        () => navigateTo("/login"),
        async () => {
            await authService.logout();
            navigateTo("/");
        },
        () => navigateTo("/settings")
    );

    defaultMenuButtonManager.createDefaultMenuButtons(activeUsername);

    header.onLogoClicked = () => navigateTo("/");

    startPage.onNonogramSelected = nonogramId => navigateTo("/n/" + nonogramId);
    startPage.onLogin = () => navigateTo("/login");
    startPage.onOpenCatalog = () => navigateTo("/catalog");
    startPage.onOpenSettings = () => navigateTo("/settings");

    catalog.onNonogramSelected = nonogramId => navigateTo("/n/" + nonogramId);

    router.run();
}

/**
 * 
 * @param {string} path 
 */
export function navigateTo(path) {
    window.location.replace(path);
}

export async function openStartPage() {
    activeComponent?.destroy();
    startPage.init(mainDiv);
    activeComponent = startPage;

    /* Check for logged in user */
    startPage.setLoggedInUsername(activeUsername);

    document.title = TITLE_STARTPAGE;
}

export async function openCatalog() {
    activeComponent?.destroy();
    catalog.init(mainDiv);
    activeComponent = catalog;

    document.title = TITLE_CATALOG;
    openNonogramId = undefined;
}

export async function openLoginPage() {
    activeComponent?.destroy();
    loginPage.init(mainDiv);
    activeComponent = loginPage;

    document.title = TITLE_LOGIN;
    openNonogramId = undefined;
}

export async function openSettings() {
    settings.init(mainDiv);
    activeComponent = settings;

    document.title = TITLE_SETTINGS;
    openNonogramId = undefined;
}

/**
 * @param {string} nonogramId
 * @returns {Promise<Boolean>} 
 */
export async function openNonogram(nonogramId) {
    /* Nothing to do if nonogram is already open */
    if (openNonogramId == nonogramId) {
        return true;
    }

    /* Load requested nonogram */
    const nonogram = (await catalogAccess.getAllNonograms()).find(x => x.id == nonogramId);
    if (!nonogram) {
        return false;
    }

    /* Load current state */
    const savefile = savefileAccess.fetchLocalSavefile();
    var stored = savefile ? getSavestateForNonogram(savefile, nonogramId) : undefined;

    /* Create new playfield */
    activeComponent?.destroy();
    const localPlayfield = new PlayfieldComponent(
        nonogramId,
        nonogram.rowHints, nonogram.colHints,
        stored?.cells,
        stored?.elapsed
    );

    localPlayfield.init(mainDiv);
    playfield = localPlayfield;
    activeComponent = playfield;

    new PlayfieldMenuButtonManager(
        menu,
        () => localPlayfield.solverService.hint(),
        () => localPlayfield.solverService.solveNext(),
        () => localPlayfield.solverService.solveFull(),
        () => localPlayfield.reset(),
        () => {
            storePlayfieldStateToStorage(localPlayfield);
            navigateTo("/");
        }
    ).createButtons();

    playfield.onStateChanged = () => {
        /* Save state to local storage */
        storePlayfieldStateToStorage(localPlayfield);

        /* Update last played nonogram id */
        const saveFile = savefileAccess.fetchLocalSavefile();

        if (!localPlayfield.hasWon) {
            saveFile.lastPlayedNonogramId = localPlayfield.nonogramId;
        } else {
            saveFile.lastPlayedNonogramId = undefined;
        }

        savefileAccess.writeLocalSavefile(saveFile);

        /* Queue sync */
        if (activeUsername) {
            savefileSyncService.queueSync();
        }
    }

    openNonogramId = nonogramId;
    document.title = "Playing " + nonogram.colHints.length + "x" + nonogram.rowHints.length + " Nonogram"
    return true;
}

/**
 * Stores the current state of the playfield to the local savefile.
 * 
 * @param {PlayfieldComponent} playfield 
 */
function storePlayfieldStateToStorage(playfield) {
    const curState = playfield.currentState;
    const savefile = savefileAccess.fetchLocalSavefile();

    putSavestate(savefile, playfield.nonogramId, {
        cells: curState.cells,
        elapsed: playfield.elapsed
    });

    savefileAccess.writeLocalSavefile(savefile);
}

export function showNotFoundPage() {
    notFoundPage.show();
}