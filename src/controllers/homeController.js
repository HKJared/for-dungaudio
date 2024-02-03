const { render } = require('ejs');
const pool = require('../config/connectDB');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

async function readAndInsertFilesInDirectory(directoryPath) {
    
    try {
        const fileNames = fs.readdirSync(directoryPath);

        for (const fileName of fileNames) {
            const filePath = `${directoryPath}/${fileName}`;

            if (filePath.endsWith('.xlsx') || filePath.endsWith('.xls')) {
                console.log(`Đang đọc và nạp dữ liệu từ file: ${filePath}`);

                const workbook = XLSX.readFile(filePath);
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(sheet);

                // nạp vào database
                for (let i = 0; i < jsonData.length; i++) {
                    const [row, field] = await pool.execute('select * from user where phoneNumber = ?', [jsonData[i].phone])

                    // Nếu chưa có thì tạo người dùng
                    if (row.length == 0) {
                        await pool.execute('insert into user (name, phoneNumber) values (?, ?)', [jsonData[i].name, jsonData[i].phone])

                        const [row2, field2] = await pool.execute('select * from user where phoneNumber = ?', [jsonData[i].phone])
                        await pool.execute('insert into address (idUser, address) values (?, ?)', [row2[0].idUser, jsonData[i].address])
                    } else {
                        await pool.execute('insert into address (idUser, address) values (?, ?)', [row[0].idUser, jsonData[i].address])
                    }
                }
            } else {
                console.log(`File ${filePath} không phải là file Excel, bỏ qua.`);
            }
        }

        console.log("Đã đọc và nạp tất cả các file trong thư mục");
    } catch (error) {
        console.error("Lỗi khi đọc và nạp dữ liệu:", error);
    }
}

let getHomePage = async (req, res) => {
    try {
        const [row, field] = await pool.execute('select * from user')

        return res.status(200).render('index', {    data: row   })
    } catch (error) {
        console.error(error)

        return res.status(404).json('Server error')
    }
}

let readData = async (req, res) => {
    try {
     // Xác định đường dẫn tuyệt đối của thư mục 'data'
        const dataDirectoryPath = path.join(__dirname, '..', 'data');

        // Gọi hàm đọc và nạp dữ liệu với đường dẫn thư mục 'data'
        await readAndInsertFilesInDirectory(dataDirectoryPath);

        // Nếu cần thêm xử lý hoặc trả về kết quả, bạn có thể thực hiện ở đây
        return res.status(200).json('Dữ liệu đã được đọc và nạp thành công.');
    } catch (error) {
        console.error(error)

        return res.status(404).json('Server error')
    }
}

let getDetailUser = async (req, res) => {
    try {
        const idUser = req.params.idUser

        const [row, field] = await pool.execute('select * from user where idUser = ?', [idUser])

        const [row2, field2] = await pool.execute('select * from address where idUser = ?', [idUser])

        return res.status(200).render('detailUser', {   data: row[0], address: row2   })
    } catch (error) {
        console.error(error)

        return res.status(404).json('Server error')
    }
}

module.exports = {
    getHomePage, readData, getDetailUser
}