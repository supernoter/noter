export const jsPDF = jest.fn().mockImplementation(() => ({
    internal: {
        pageSize: {
            width: 210,
        },
    },
    html: jest.fn().mockImplementation((element, options) => {
        if (options && options.callback) {
            options.callback({ save: jest.fn() })
        }
        return true
    }),
    save: jest.fn(),
}))
