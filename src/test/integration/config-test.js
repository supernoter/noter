// Electron app config structure test
const { _electron: electron } = require('playwright')
const path = require('path')
const assert = require('assert')

// Expected config structure
const expectedConfig = {
    window: {
        opacity: null,
        width: null,
        height: null,
    },
    font: {
        colour: null,
        size: null,
        family: null,
    },
    background: {
        colour: null,
        gradient: null,
        image: null,
        opacity: null,
    },
    statusBar: {
        font: {
            colour: null,
            size: null,
            family: null,
        },
        background: {
            colour: null,
        },
    },
    preview: {
        font: {
            colour: null,
            size: null,
            family: null,
        },
        background: {
            colour: null,
        },
    },
    ollama_host: null,
    ollama_model_name: null,
}

// Helper function to recursively verify config structure
function verifyConfigStructure(actual, expected, path = '') {
    for (const key in expected) {
        const currentPath = path ? `${path}.${key}` : key

        // Check if key exists
        assert(key in actual, `Missing expected key: ${currentPath}`)

        // If expected value is an object, recurse
        if (expected[key] !== null && typeof expected[key] === 'object') {
            assert(
                typeof actual[key] === 'object',
                `Property ${currentPath} should be an object`
            )
            verifyConfigStructure(actual[key], expected[key], currentPath)
        }
    }
    return true
}

;(async () => {
    try {
        const electronApp = await electron.launch({
            args: [path.join(__dirname, '../../main.js'), '--no-intro'],
        })
        const window = await electronApp.firstWindow()
        await window.waitForLoadState('domcontentloaded')
        const config = await window.evaluate(async () => {
            return window.api.getConfig()
        })
        if (!config) {
            throw new Error('failed to retrieve config')
        }
        const isValid = verifyConfigStructure(config, expectedConfig)
        assert(isValid, 'Config structure validation failed')

        // example properties, for manual inspection
        await window.evaluate((config) => {
            console.log('font color:', config.font.colour)
            console.log(
                'window size:',
                config.window.width,
                'x',
                config.window.height
            )
            console.log('ollama model: ', config.ollama_model_name)
        }, config)
        await window.waitForTimeout(1000)
        await electronApp.close()
        console.log('✅ [config] test completed successfully!')
    } catch (error) {
        console.error('test failed:', error)
        process.exit(1)
    }
})()
