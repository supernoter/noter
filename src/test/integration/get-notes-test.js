// Test get-notes functionality on a fresh temporary directory.
const { _electron: electron } = require('playwright')
const path = require('path')
const assert = require('assert')
const fs = require('fs')
const os = require('os')

const tempTestDir = path.join(os.tmpdir(), `electron-test-${Date.now()}`)
fs.mkdirSync(tempTestDir, { recursive: true })
console.log(`created temporary test directory: ${tempTestDir}`)
// Set enviroment variable to use the temporary test dir.
process.env.NOTER_TEST_DIR = tempTestDir

const testNoteContent = 'This is a test note created for testing purposes.'
const testFn = 'test-note-0.md'
fs.writeFileSync(path.join(tempTestDir, testFn), testNoteContent)
;(async () => {
    try {
        const electronApp = await electron.launch({
            args: [path.join(__dirname, '../../main.js'), '--no-intro'],
        })
        const window = await electronApp.firstWindow()
        await window.waitForLoadState('domcontentloaded')
        let result = await window.evaluate(async () => {
            return window.api.getNotes()
        })
        console.log('retrieved notes:', result)
        assert.strictEqual(
            JSON.stringify(result),
            JSON.stringify([testFn]),
            'did not match files'
        )
        await window.waitForTimeout(100)
        await electronApp.close()
        console.log('✅ [get-notes] test completed successfully!')
        fs.rmSync(tempTestDir, { recursive: true, force: true })
        console.log(`cleaned up temporary test directory: ${tempTestDir}`)
    } catch (error) {
        console.error('test failed:', error)
        process.exit(1)
    }
})()
