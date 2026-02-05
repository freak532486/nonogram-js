import { CatalogAccess } from "./catalog/catalog-access";
import { Catalog } from "./catalog/component/catalog.component";
import { Header } from "./header/header.component";
import { Menu } from "./menu/menu.component";
import { NotFoundPage } from "./not-found-page/not-found-page";
import { PlayfieldComponent } from "./playfield/playfield.component";
import { Router } from "./router";
import { StartPage } from "./start-page/component/start-page.component";
import { StartPageNonogramSelector } from "./start-page/internal/start-page-nonogram-selector";
import LoginComponent from "./auth/components/login-component/login.component"
import AuthService from "./auth/services/auth-service"
import tokenRepositoryInstance from "./auth/services/token-repository-instance"
import ApiServiceImpl from "./api/api-service-impl"
import * as storage from "./storage"
import * as storageMigration from "./storage-migration"


/* ------------------------------ IMPLEMENTATION ------------------------------ */

const TITLE_STARTPAGE = "NonoJs · Free Nonogram Platform";
const TITLE_CATALOG = "Looking at catalog";
const TITLE_LOGIN = "Log in to NonoJs";

const contentRoot = /** @type {HTMLElement} */ (document.getElementById("content-column"));
const headerDiv = /** @type {HTMLElement} */ (document.getElementById("header-div"));
const mainDiv = /** @type {HTMLElement} */ (document.getElementById("main-div"));

const catalogAccess = new CatalogAccess();
const startPageNonogramSelector = new StartPageNonogramSelector(catalogAccess);

/** @type {any} */
let activeComponent = undefined;

let notFoundPage = new NotFoundPage();
let router = new Router();
let menu = new Menu();
let header = new Header(menu);
let catalog = new Catalog(catalogAccess);
let startPage = new StartPage(startPageNonogramSelector, catalogAccess);
export let apiService = new ApiServiceImpl(tokenRepositoryInstance);
let authService = new AuthService(apiService, tokenRepositoryInstance);

let loginPage = new LoginComponent(
    async (username, password) => {
        const result = await authService.login(username, password);

        switch (result.status) {
            case "ok":
                loginPage.loginMessage = "Success. You are now logged in as '" + username + "'";
                loginPage.loginMessageColor = "#3dc41c";
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
                loginPage.registerMessage = "User created successfully.";
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
    window.addEventListener("load", () => {
        catalogAccess.invalidateCache();
        storageMigration.performStorageMigration();
    });

    await menu.init(contentRoot);
    await header.init(headerDiv);

    header.onLogoClicked = () => navigateTo("/");
    menu.onLogin = async () => navigateTo("/login");

    startPage.onNonogramSelected = nonogramId => navigateTo("/n/" + nonogramId);
    startPage.onLogin = () => navigateTo("/login");
    startPage.onOpenCatalog = () => navigateTo("/catalog");

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
    const activeUser = await authService.getCurrentUsername();
    startPage.setLoggedInUsername(activeUser);

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
    var stored = storage.retrieveStoredState(nonogramId);

    /* Create new playfield */
    activeComponent?.destroy();
    playfield = new PlayfieldComponent(
        nonogramId,
        nonogram.rowHints, nonogram.colHints,
        menu,
        stored?.cells,
        stored?.elapsed
    );

    playfield.init(mainDiv);
    activeComponent = playfield;

    playfield.onExit = () => {
        storePlayfieldStateToStorage(playfield);
        navigateTo("/");
    }

    playfield.onStateChanged = () => {
        storePlayfieldStateToStorage(playfield);

        /* Update last played nonogram id */
        const saveFile = storage.fetchStorage();

        if (!playfield.hasWon) {
            saveFile.lastPlayedNonogramId = playfield.nonogramId;
        } else {
            saveFile.lastPlayedNonogramId = undefined;
        }

        storage.putStorage(saveFile);
    }

    openNonogramId = nonogramId;
    document.title = "Playing " + nonogram.colHints.length + "x" + nonogram.rowHints.length + " Nonogram"
    return true;
}

/**
 * Stores the current state of the playfield to storage.
 * 
 * @param {PlayfieldComponent} playfield 
 */
function storePlayfieldStateToStorage(playfield) {
    const curState = playfield.currentState;

    storage.storeState(playfield.nonogramId, {
        cells: curState.cells,
        elapsed: playfield.elapsed
    });
}

export function showNotFoundPage() {
    notFoundPage.show();
}