const ensureAuthorization = require('../auth'); // 인증 모듈
const jwt = require('jsonwebtoken');
const conn = require('../mariadb');
const { StatusCodes } = require('http-status-codes');


// (카테고리 별, 신간 여부) 전체 도서 목록 조회
const allBooks = (req, res) => {
    let { category_id, newBooks, limit, currentPage } = req.query;

    // limit : page 당 도서 수      ex. 3
    // currentPage : 현재 몇 페이지 ex. 1, 2, 3,...
    // offset :                    ex. 0, 3, 6, 9, 12, ...
    //                             ex. limit * (currentPage-1)
    
    let offset = limit * (currentPage-1);
    let sql = "SELECT *, (SELECT count(*) FROM likes WHERE books.id=liked_book_id) AS likes FROM books";
    let values = [];
    if(category_id && newBooks) {
        sql += " WHERE category_id=? AND pub_date BETWEEN DATE_SUB(NOW(), INTERVAL 1 MONTH) AND NOW()";
        values = [category_id];
    } else if(category_id) {
        sql += " WHERE category_id=?";
        values = [category_id];
    } else if(newBooks) {
        sql += " WHERE pub_date BETWEEN DATE_SUB(NOW(), INTERVAL 1 MONTH) AND NOW()";
    }

    sql += " LIMIT ? OFFSET ?";
    values.push(parseInt(limit), offset);

    conn.query(sql, values,
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
};


const bookDetail = (req, res) => {

    // 로그인 상태가 아니면 => liked 빼고 보내주기
    // 로그인 상태면 => liked 추가하기

    let authorization = ensureAuthorization(req, res);

    if(authorization instanceof jwt.TokenExpiredError) {
        res.status(StatusCodes.UNAUTHORIZED).json({
            "message" : "로그인 세션이 만료되었습니다. 다시 로그인 해주세요."
        });
    } else if (authorization instanceof jwt.JsonWebTokenError) {
        res.status(StatusCodes.BAD_REQUEST).json({
            "message" : "잘못된 토큰입니다."
        });
    }else if (authorization instanceof ReferenceError) {
        let book_id = req.params.id;

        let sql = `SELECT *, 
                        (SELECT count(*) FROM likes WHERE liked_book_id=books.id) AS likes
                    FROM books 
                    LEFT JOIN category 
                    ON books.category_id = category.category_id
                    WHERE books.id=?`;
        let values = [book_id];
        conn.query(sql, values,
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
    } else {
        let book_id = req.params.id;
        
        let sql = `SELECT *, 
                        (SELECT count(*) FROM likes WHERE liked_book_id=books.id) AS likes,
                        (SELECT EXISTS (SELECT * FROM likes WHERE user_id=? AND liked_book_id=?)) AS liked 
                    FROM books 
                    LEFT JOIN category 
                    ON books.category_id = category.category_id
                    WHERE books.id=?`;
        let values = [authorization.id, book_id, book_id];
        conn.query(sql, values,
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
    }
};

module.exports = {
    allBooks,
    bookDetail
};