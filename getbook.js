const conn = require('./mariadb');


const getBookDetails = (book_id, authorization, callback) => {
    let sql = '';
    let values = [];

    if (authorization instanceof ReferenceError) {
        // 비로그인 상태: liked 필드 없이 쿼리 작성
        sql = `SELECT *, 
                    (SELECT count(*) FROM likes WHERE liked_book_id=books.id) AS likes
                FROM books 
                LEFT JOIN category 
                ON books.category_id = category.category_id
                WHERE books.id=?`;
        values = [book_id];
    } else {
        // 로그인 상태: liked 필드를 추가하여 쿼리 작성
        sql = `SELECT *, 
                    (SELECT count(*) FROM likes WHERE liked_book_id=books.id) AS likes,
                    (SELECT EXISTS (SELECT * FROM likes WHERE user_id=? AND liked_book_id=?)) AS liked 
                FROM books 
                LEFT JOIN category 
                ON books.category_id = category.category_id
                WHERE books.id=?`;
        values = [authorization.id, book_id, book_id];
    }

    // SQL 실행
    conn.query(sql, values, (err, results) => {
        if (err) {
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