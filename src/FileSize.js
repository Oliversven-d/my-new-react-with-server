const fs = require('fs');
const path = require('path');

const directories = ['build/static/js', 'build/static/css'];

directories.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    fs.readdir(dirPath, (err, files) => {
        if (err) throw err;
        console.log(`\nFiles in ${dir}:`);
        files.forEach(file => {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);
            console.log(`${file}: ${stats.size} bytes`);
        });
    });
});













