const conn = require('../mariadb');
const { StatusCodes } = require('http-status-codes');

// 주문하기
const order = (req, res) => {
    const {items, delivery, totalQuantity, totalPrice, userId, firtBookTitle}  = req.body;

    let delivery_id;
    let order_id;

    let sql = "INSERT INTO delivery (address, receiver, contact) VALUES (?, ?, ?)";
    let values = [delivery.address, delivery.receiver, delivery.contact];
    conn.query(sql, values,
        (err, results) => {
            if (err) {
                console.error(err);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
            }

            delivery_id = results.insertId;
            
            return res.status(StatusCodes.OK).json(results);
    })

    sql = `INSERT INTO orders (book_title, total_quantity, total_price, user_id, delivery_id) 
            VALUES (?, ?, ?, ?, ?)`;
    values = [firtBookTitle, totalQuantity, totalPrice, userId, delivery_id];
    conn.query(sql, values,
        (err, results) => {
            if (err) {
                console.error(err);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
            }

            order_id = results.insertId;
            console.log(order_id);
            
            return res.status(StatusCodes.OK).json(results);
    })

    sql = `INSERT INTO orderedBook (order_id, book_id, quantity) VALUES ?`;
    // items.. 배열 : 요소들을 하나씩 꺼내서(foreach문 돌려서) >
    values = [];
    //forEach문을 돌며 알아서 2차원 배열로 생성
    items.forEach((item) => {
        values.push([order_id, item.book_id, item.quantity]);
        console.log(values);
    })
    conn.query(sql, [values],
        (err, results) => {
            if (err) {
                console.error(err);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
            }

            return res.status(StatusCodes.OK).json(results);
    })        
    
};

// 주문 목록 조회
const getOrders = (req, res) => {
    res.json('주문 목록 조회');
};

// 주문 상세 조회
const getOrderDetail = (req, res) => {
    res.json('주문 상세 상품 조회');
};

module.exports = {
    order,
    getOrders,
    getOrderDetail
};