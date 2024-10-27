const conn = require('../mariadb');
const { StatusCodes } = require('http-status-codes');

const allCategory = (req, res) => {
    let allCategoryRes = {};
    // 카테고리 전체 목록 리스트
    let sql = "SELECT * FROM category";
    conn.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(StatusCodes.BAD_REQUEST).end();
        }

        if(results.length){   
            results.map(function(result) {
                result.id = result.category_id;
                result.name = result.category_name;
                delete result.category_id;
                delete result.category_name;
            });
        allCategoryRes.category = results;
        return res.status(StatusCodes.OK).json(results);
        }
    })   
};



module.exports = {
    allCategory
};