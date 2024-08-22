module.exports = {
    apps: [
        {
            name: "Food App",
            script: "./index.js",
            watch: true,
            output: "logs/out.txt",
            error: "logs/error.txt",
            log: "logs/combined.outerr.txt",
            ignore_watch: ['logs/*', 'uploads/*', 'node_modules/*', '.git/*'],
        }
    ]
}