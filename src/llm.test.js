const mod = require('./llm.js')
require('whatwg-fetch')

beforeEach(() => {
    Object.defineProperty(window, 'api', {
        value: {
            OLLAMA_HOST: 'http://localhost:11434',
            NOTER_OLLAMA_MODEL: 'dummy',
            getConfig: jest.fn().mockReturnValue({
                ollama_host: null,
                ollama_model_name: null,
            }),
        },
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

    if (url.includes('/v1/test')) {
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ response: 'test data' }),
        })
    }

    // Handle models listing endpoint (OpenAI format)
    if (url.includes('/v1/models')) {
        // Check if it's a specific model endpoint or the models list
        if (url.match(/\/v1\/models\/[^\/]+$/)) {
            console.log('mocking specific model endpoint:', url)
            const modelName = url.split('/').pop()

            if (modelName === 'dummy') {
                return Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            id: 'dummy',
                            object: 'model',
                            owned_by: 'organization',
                            permission: [],
                        }),
                })
            } else {
                return Promise.resolve({
                    ok: false,
                    status: 404,
                    statusText: 'Not Found',
                    json: () =>
                        Promise.resolve({
                            error: {
                                message: `Model '${modelName}' not found`,
                                type: 'invalid_request_error',
                                code: 'model_not_found',
                            },
                        }),
                })
            }
        } else {
            console.log('mocking v1/models list')
            return Promise.resolve({
                ok: true,
                json: () =>
                    Promise.resolve({
                        data: [
                            {
                                id: 'dummy',
                                object: 'model',
                                owned_by: 'organization',
                                permission: [],
                            },
                        ],
                        object: 'list',
                    }),
            })
        }
    }

    // Handle chat completions endpoint
    if (url.includes('/v1/chat/completions')) {
        console.log('mocking chat/completions')

        if (requestBody?.stream) {
            // Mock streaming response
            const mockResponse = {
                ok: true,
                status: 200,
                statusText: 'OK',
                body: {
                    getReader: () => ({
                        read: (() => {
                            let callCount = 0
                            return () => {
                                if (callCount === 0) {
                                    callCount++
                                    return Promise.resolve({
                                        done: false,
                                        value: Buffer.from(
                                            `data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1694268190,"model":"dummy","system_fingerprint":"fp_44709d6fcb","choices":[{"index":0,"delta":{"content":"This"},"logprobs":null,"finish_reason":null}]}\n\n`
                                        ),
                                    })
                                } else if (callCount === 1) {
                                    callCount++
                                    return Promise.resolve({
                                        done: false,
                                        value: Buffer.from(
                                            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1694268190,"model":"dummy","system_fingerprint":"fp_44709d6fcb","choices":[{"index":0,"delta":{"content":" is a test"},"logprobs":null,"finish_reason":null}]}\n\n'
                                        ),
                                    })
                                } else {
                                    return Promise.resolve({ done: true })
                                }
                            }
                        })(),
                        releaseLock: () => {},
                    }),
                },
            }
            return Promise.resolve(mockResponse)
        } else {
            // Mock regular response
            return Promise.resolve({
                ok: true,
                json: () =>
                    Promise.resolve({
                        id: 'chatcmpl-123',
                        object: 'chat.completion',
                        created: 1694268190,
                        model: 'dummy',
                        choices: [
                            {
                                index: 0,
                                message: {
                                    role: 'assistant',
                                    content: 'This is a test response',
                                },
                                finish_reason: 'stop',
                            },
                        ],
                        usage: {
                            prompt_tokens: 10,
                            completion_tokens: 20,
                            total_tokens: 30,
                        },
                    }),
            })
        }
    }

    // Default or unmatched URLs
    return Promise.reject(new Error(`Unhandled fetch url: ${url}`))
})

describe('llm module', () => {
    test('urlFor joins urls', () => {
        const llm = new mod.Llm({ apiEndpoint: 'https://example.com' })
        const path = 'a/b/c'
        const expected = 'https://example.com/v1/a/b/c'
        expect(llm.urlFor(path)).toBe(expected)
    })

    test('dummy model is available', async () => {
        const llm = new mod.Llm({
            apiEndpoint: 'https://example.com',
            model: 'dummy',
        })
        const isModelAvailable = await llm.checkModelAvailability()
        expect(isModelAvailable).toBe(true)
    })

    test('unavailable model fails the check, but falls back to an available model', async () => {
        const llm = new mod.Llm({
            apiEndpoint: 'https://example.com',
            model: 'nosuchmodel',
        })
        const isModelAvailable = await llm.checkModelAvailability()
        expect(isModelAvailable).toBe(true)
    })

    test('model status of unavailable model is null', async () => {
        const llm = new mod.Llm({
            apiEndpoint: 'https://example.com',
            model: 'nosuchmodel',
        })
        expect(llm.getModelStatus()).toBe(null)
    })

    test('model status of available model is currently its name', async () => {
        const llm = new mod.Llm({
            apiEndpoint: 'https://example.com',
            model: 'dummy',
        })
        await llm.checkModelAvailability()
        expect(llm.getModelStatus().currentModel).toBe('dummy')
    })

    test('generateText returns content for non-streaming response', async () => {
        const llm = new mod.Llm({
            apiEndpoint: 'https://example.com',
            model: 'dummy',
        })
        await llm.checkModelAvailability()
        const response = await llm.generateText('Test prompt')
        expect(response).toBe('This is a test response')
    })

    test('generateText handles streaming response correctly', async () => {
        const llm = new mod.Llm({
            apiEndpoint: 'https://example.com',
            model: 'dummy',
        })
        await llm.checkModelAvailability()

        const mockOnToken = jest.fn()
        const response = await llm.generateText('Test prompt', mockOnToken)

        expect(response).toBe('This is a test')
        expect(mockOnToken).toHaveBeenCalledTimes(2)
        expect(mockOnToken).toHaveBeenCalledWith('This')
        expect(mockOnToken).toHaveBeenCalledWith(' is a test')
    })
})
