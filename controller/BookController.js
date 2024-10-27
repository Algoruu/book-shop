const ensureAuthorization = require('../auth'); // 인증 모듈
const getBookDetails = require('../getbook');
const jwt = require('jsonwebtoken');
const conn = require('../mariadb');
const { StatusCodes } = require('http-status-codes');


// (카테고리 별, 신간 여부) 전체 도서 목록 조회
const allBooks = (req, res) => {
    let allBooksRes = {};
    let { category_id, newBooks, limit, currentPage } = req.query;

    // limit : page 당 도서 수      ex. 3
    // currentPage : 현재 몇 페이지 ex. 1, 2, 3,...
    // offset :                    ex. 0, 3, 6, 9, 12, ...
    //                             ex. limit * (currentPage-1)
    
    let offset = limit * (currentPage-1);
    let sql = "SELECT SQL_CALC_FOUND_ROWS *, (SELECT count(*) FROM likes WHERE books.id=liked_book_id) AS likes FROM books";
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
                return res.status(StatusCodes.BAD_REQUEST).end();
            }
            console.log(results);
            
        if(results.length){   
            results.map(function(result) {
                result.pubDate = result.pub_date;
                delete result.pub_date;
            });

            allBooksRes.books = results;
        } 
        else
            return res.status(StatusCodes.NOT_FOUND).end();
    })

    sql = "SELECT found_rows()";
    values.push(parseInt(limit), offset);

    conn.query(sql,
        (err, results) => {
            if (err) {
                console.error(err);
                return res.status(StatusCodes.BAD_REQUEST).end();
            }

            let pagination = {};
            pagination.currentPage = parseInt(currentPage);
            pagination.totalCount =results[0]["found_rows()"];

            allBooksRes.pagination = pagination;

            return res.status(StatusCodes.OK).json(allBooksRes);
    })
};


const bookDetail = (req, res) => {
    // 로그인 상태 확인
    let authorization = ensureAuthorization(req, res);

    if (authorization instanceof jwt.TokenExpiredError) {
        res.status(StatusCodes.UNAUTHORIZED).json({
            "message": "로그인 세션이 만료되었습니다. 다시 로그인 해주세요."
        });
    } else if (authorization instanceof jwt.JsonWebTokenError) {
        res.status(StatusCodes.BAD_REQUEST).json({
            "message": "잘못된 토큰입니다."
        });
    } else {
        let book_id = req.params.id;

        // 책 정보 가져오기
        getBookDetails(book_id, authorization, (err, book) => {
            if (err) {
                console.error(err);
                return res.status(StatusCodes.BAD_REQUEST).end();
            }

            if (book) {
                return res.status(StatusCodes.OK).json(book);

                
            } else {
                return res.status(StatusCodes.NOT_FOUND).end();
            }
        });
    }
};


module.exports = {
    allBooks,
    bookDetail
};