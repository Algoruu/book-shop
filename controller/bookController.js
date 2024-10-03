const conn = require('../mariadb');
const { StatusCodes } = require('http-status-codes');


const allBooks = (req, res) => {
    let {category_id} = req.query;
    
    if(category_id) {
        let sql = "SELECT * FROM books WHERE category_id=?";
        conn.query(sql, category_id,
            (err, results) => {
                if (err) {
                    console.error(err);
                    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
                }
            
            if(results.length)    
                return res.status(StatusCodes.OK).json(results);
            else
                return res.status(StatusCodes.NOT_FOUND).end();
    
        })
 
    } else {
            // (요약된) 전체 도서 리스트
            let sql = "SELECT * FROM books";
            conn.query(sql, (err, results) => {
                if (err) {
                    console.error(err);
                    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
                }

                return res.status(StatusCodes.OK).json(results);
            })

        }

};


const bookDetail = (req, res) => {
    let {id} = req.params;
    
    let sql = "SELECT * FROM books WHERE id=?";
    conn.query(sql, id,
        (err, results) => {
            if (err) {
                console.error(err);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
            }
        
        if(results[0])    
            return res.status(StatusCodes.OK).json(results[0]);
        else
            return res.status(StatusCodes.NOT_FOUND).end();

    })
};

module.exports = {
    allBooks,
    bookDetail
};