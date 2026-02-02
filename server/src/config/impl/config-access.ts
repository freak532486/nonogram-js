import * as fs from "fs"
import Config from "../types/config";
import { FastifyInstance } from "fastify";

/**
 * Reads a configuration from a given file. Returns undefined if no config exists at the given location.
 */
export function readConfig(path: string): Config | undefined {
    if (!fs.existsSync(path)) {
        return undefined;
    }

    try {
        const data = fs.readFileSync(path, "utf-8");
        return JSON.parse(data);
    } catch (error) {
        throw new Error("Failed reading settings from '" + path  + "'.");
    }
}

/**
 * Returns the value of the key in the given config. Returns 'undefined' if no such setting exists or is not a string.
 */
export function getStringSetting(fastify: FastifyInstance, key: string): string | undefined
{
    const config = fastify.state.config;
    const maybeValue = config[key];
    if (typeof maybeValue === "string") {
        return maybeValue;
    }

    return undefined;
}

/**
 * Returns the value of the key in the given config. Throws if the setting has not been set.
 */
export function getStringSettingOrThrow(fastify: FastifyInstance, key: string): string
{
    const value = getStringSetting(fastify, key);
    if (!value) {
        throw new Error("Setting '" + key + "' has not been set.");
    }

    return value;
}

/**
 * Returns the value of the key in the given config. Returns 'undefined' if no such setting exists or is not a string.
 */
export function getNumberSetting(fastify: FastifyInstance, key: string): number | undefined
{
    const config = fastify.state.config;
    const maybeValue = config[key];
    if (typeof maybeValue === "number") {
        return maybeValue;
    }

    return undefined;
}


/**
 * Returns the value of the key in the given config. Throws if the setting has not been set.
 */
export function getNumberSettingOrThrow(fastify: FastifyInstance, key: string): string
{
    const value = getNumberSettingOrThrow(fastify, key);
    if (!value) {
        throw new Error("Setting '" + key + "' has not been set.");
    }

    return value;
}