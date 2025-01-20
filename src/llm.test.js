const mod = require('./llm.js')
require('whatwg-fetch')

beforeEach(() => {
    Object.defineProperty(window, 'api', {
        value: { OLLAMA_HOST: 'http://localhost:11434' },
        writable: true,
    })
})

global.fetch = jest.fn((url, options) => {
    const requestBody = options?.body ? JSON.parse(options.body) : null
    if (url.includes('ollama')) {
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ response: 'ollama data' }),
        })
    }

    if (url.includes('api/test')) {
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ response: 'test data' }),
        })
    }

    if (url.includes('api/tags')) {
        console.log('mocking api/tags')
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ models: [{ name: 'dummy' }] }),
        })
    }

    if (url.includes('api/show')) {
        console.log('mocking api/show')
        if (requestBody?.model === 'dummy') {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ data: {} }),
            })
        } else {
            return Promise.resolve({
                ok: false,
                json: () => Promise.resolve({ data: {} }),
            })
        }
    }

    // Default or unmatched URLs
    return Promise.reject(new Error(`Unhandled fetch url: ${url}`))
})


describe('llm module', () => {
    test('urlFor joins urls', () => {
        const llm = new mod.Llm('https://example.com', 'dummy')
        const path = 'a/b/c'
        const expected = 'https://example.com/api/a/b/c'
        expect(llm.urlFor(path)).toBe(expected)
    })
    test('dummy model is available', async () => {
        const llm = new mod.Llm(null, 'dummy')
        const isModelAvailable = await llm.checkModelAvailability()
        expect(isModelAvailable).toBe(true)
    })
    test('unavailable model fails the check, but falls back to an available model', async () => {
        const llm = new mod.Llm(null, 'nosuchmodel')
        const isModelAvailable = await llm.checkModelAvailability()
        expect(isModelAvailable).toBe(true)
    })
    test('model status of unavailable model is null', async () => {
        const llm = new mod.Llm(null, 'nosuchmodel')
        expect(llm.getModelStatus()).toBe(null)
    })
    test('model status of available model is currently its name', async () => {
        const llm = new mod.Llm(null, 'dummy')
        await llm.checkModelAvailability()
        expect(llm.getModelStatus().currentModel).toBe('dummy')
    })
})
