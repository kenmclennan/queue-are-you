import * as dotenv from 'dotenv';
const debug = require('debug')('env:vars');
debug.enabled = process.env.NODE_ENV !== 'production';

export const getEnv = (key: string, defaultValue?: string): string => {
    dotenv.config();
    const val = process.env[key] || null;
    if (val !== null) {
        if (val.match(/^[Tt]rue$/)) {
            debug(`${key}: true`);
            return 'true';
        }
        if (val.match(/^[Ff]alse$/)) {
            debug(`${key}: false`);
            return 'false';
        }
        const value = val.replace(/\\n/g, '\n');
        debug(`${key}: ${value}`);
        return value;
    }

    if (defaultValue !== undefined) {
        debug(`${key}: ${defaultValue}`);
        return defaultValue;
    }

    throw new Error(`Undefined variable ${key}`);
};

export const getEnvArray = (key: string, defaultValue?: string[]) => {
    const val = process.env[key] || null;
    if (val !== null) {
        const values = val
        .replace('[', '')
        .replace(']', '')
        .replace(/\\n/g, '\n')
        .replace(/\s/g, '')
        .split(',');
        debug(`${key}: [${values}]`);
        return values;
    }

    if (defaultValue !== undefined) {
        debug(`${key}: [${defaultValue}]`);
        return defaultValue;
    }

    throw new Error(`Undefined variable ${key}`);
};
