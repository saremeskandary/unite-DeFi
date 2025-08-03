/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/en/configuration.html
 */

export default {
    clearMocks: true,
    moduleFileExtensions: ['js', 'json', 'ts', 'mjs'],
    rootDir: 'tests',
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[tj]s?(x)'],
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    transform: {
        '^.+\\.(t|j)s$': ['@swc/jest', {
            jsc: {
                parser: {
                    syntax: 'typescript',
                    tsx: false,
                    decorators: false,
                },
                target: 'es2020',
            },
            module: {
                type: 'es6'
            }
        }]
    },
    extensionsToTreatAsEsm: ['.ts'],
    transformIgnorePatterns: [],
    setupFilesAfterEnv: ['<rootDir>/setup.js']
}
