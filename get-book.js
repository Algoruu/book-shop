const ensureAuthorization = require('./auth');

const getBookDetails = (book_id, authorization, callback) => {
    let sql = '';
    let values = [];

    // 로그인 여부에 따라 쿼리와 파라미터 설정
    if (authorization) {
        sql = `SELECT *, 
                      (SELECT count(*) FROM likes WHERE liked_book_id=books.id) AS likes,
                      (SELECT EXISTS (SELECT * FROM likes WHERE user_id=? AND liked_book_id=?)) AS liked 
                 FROM books 
                 LEFT JOIN category 
                 ON books.category_id = category.category_id
                 WHERE books.id=?`;
        values = [authorization.id, book_id, book_id];
    } else {
        sql = `SELECT *, 
                      (SELECT count(*) FROM likes WHERE liked_book_id=books.id) AS likes
                 FROM books 
                 LEFT JOIN category 
                 ON books.category_id = category.category_id
                 WHERE books.id=?`;
        values = [book_id];
    }

    // SQL 실행
    conn.query(sql, values, (err, results) => {
        if (err) {
            console.error(err);
            return callback(err);
        }

        if (results[0]) {
            callback(null, results[0]);
        } else {
            callback(null, null); // 책을 찾지 못한 경우
        }
    });
};




module.exports = getBookDetails;