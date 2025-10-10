# HỆ THỐNG MICROSERVICES E-COMMERCE

## (Auth • Product • Order • RabbitMQ)

## 1. Giới thiệu tổng quan

Hệ thống E-Commerce Microservices được xây dựng bằng Node.js (Express), MongoDB và RabbitMQ, mô phỏng quy trình đặt hàng trong hệ thống thương mại điện tử theo mô hình microservice.

Hệ thống bao gồm 3 dịch vụ chính:

- Auth Service – xử lý đăng ký, đăng nhập và xác thực người dùng (JWT).
- Product Service – quản lý sản phẩm, tiếp nhận yêu cầu mua hàng và gửi thông tin đơn hàng sang RabbitMQ.
- Order Service – tiếp nhận thông tin đơn hàng từ RabbitMQ, xử lý và lưu trữ vào cơ sở dữ liệu.
- RabbitMQ – trung gian truyền thông tin bất đồng bộ giữa các service.

Mỗi service hoạt động độc lập, có cơ sở dữ liệu riêng, và giao tiếp với nhau qua REST API hoặc message broker (RabbitMQ).

## 2. Kiến trúc hệ thống

Hệ thống được thiết kế theo mô hình microservices, trong đó mỗi service đảm nhiệm một chức năng riêng biệt và giao tiếp với nhau thông qua RabbitMQ.

### 2.1. Auth Service

- Xử lý xác thực người dùng: đăng ký, đăng nhập, tạo JWT token.
- Cung cấp middleware xác thực để bảo vệ API.
- Lưu thông tin người dùng trong MongoDB (auth_db).

### 2.2. Product Service

- Quản lý sản phẩm (tạo, xem danh sách).
- Nhận yêu cầu mua hàng và gửi message sang queue "orders".
- Nhận phản hồi từ Order Service qua queue "products".

Quy trình:

1. Người dùng gửi yêu cầu POST /api/products/buy kèm JWT.
2. Product Service truy vấn sản phẩm, tạo orderId và gửi message sang RabbitMQ.
3. Order Service nhận message, xử lý và phản hồi lại qua queue "products".
4. Product Service nhận phản hồi và cập nhật trạng thái đơn hàng.

### 2.3. Order Service

- Nhận thông tin đơn hàng từ queue "orders".
- Tính tổng tiền và lưu vào MongoDB (order_db).
- Gửi phản hồi kết quả sang queue "products".

### 2.4. RabbitMQ

RabbitMQ là message broker trung gian giữa Product và Order Service.

| Queue    | Gửi từ          | Nhận tại        | Mục đích                   |
| -------- | --------------- | --------------- | -------------------------- |
| orders   | Product Service | Order Service   | Yêu cầu tạo đơn hàng       |
| products | Order Service   | Product Service | Phản hồi đơn hàng hoàn tất |

## 3. Environment Variables (Biến môi trường)

Mỗi service có file `.env` riêng để cấu hình cổng, kết nối cơ sở dữ liệu, JWT và RabbitMQ.  
Các biến này giúp hệ thống linh hoạt khi chuyển môi trường từ local sang production hoặc Docker.

### 3.1 Auth Service `.env`

| Biến               | Mô tả                                | Giá trị mẫu                   |
| ------------------ | ------------------------------------ | ----------------------------- |
| `PORT`             | Cổng chạy service Auth               | `3000`                        |
| `MONGODB_AUTH_URI` | URI kết nối MongoDB cho Auth Service | `mongodb://localhost/auth_db` |
| `JWT_SECRET`       | Khóa bí mật để ký và xác thực JWT    | `mysecretkey`                 |

**Ví dụ:**

```bash
PORT=3000
MONGODB_AUTH_URI=mongodb://localhost/auth_db
JWT_SECRET=mysecretkey
```

### 3.2 Product Service `.env`

| Biến                  | Mô tả                                      | Giá trị mẫu                      |
| --------------------- | ------------------------------------------ | -------------------------------- |
| `PORT`                | Cổng chạy Product Service                  | `3001`                           |
| `MONGODB_PRODUCT_URI` | URI kết nối MongoDB cho Auth Service       | `mongodb://localhost/product_db` |
| `JWT_SECRET`          | Khóa JWT để xác thực request từ người dùng | `mysecretkey`                    |
| `RABBITMQ_URI`        | Địa chỉ kết nối RabbitMQ                   | `amqp://localhost:5672`          |

**Ví dụ:**

```bash
PORT=3001
MONGODB_PRODUCT_URI=mongodb://localhost/product_db
RABBITMQ_URI=amqp://localhost:5672
JWT_SECRET=mysecretkey
```

### 3.3 Order Service `.env`

| Biến                  | Mô tả                                | Giá trị mẫu                    |
| --------------------- | ------------------------------------ | ------------------------------ |
| `PORT`                | Cổng chạy Order Service              | `3002`                         |
| `MONGODB_PRODUCT_URI` | URI kết nối MongoDB cho Auth Service | `mongodb://localhost/order_db` |
| `RABBITMQ_URI`        | Địa chỉ kết nối RabbitMQ             | `amqp://localhost:5672`        |

**Ví dụ:**

```bash
PORT=3002
MONGODB_ORDER_URI=mongodb://localhost/order_db
RABBITMQ_URI=amqp://localhost:5672
```

### 3.4 RabbitMQ (nếu dùng Docker)

Nếu chạy RabbitMQ bằng Docker, đảm bảo container đang hoạt động với port và host đúng trong `.env`.

**Lệnh khởi tạo RabbitMQ container:**

```bash
docker run -d --hostname rabbitmq --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

**Cấu hình trùng khớp trong `.env`:**

```bash
RABBITMQ_URI=amqp://localhost:5672
```

**Thông tin đăng nhập mặc định:**

```
Username: guest
Password: guest
```

Mỗi service có file .env riêng:

### Auth Service

```
PORT=3000
MONGODB_AUTH_URI=mongodb://localhost/auth_db
JWT_SECRET=mysecretkey
```

### Product Service

```
PORT=3001
MONGODB_PRODUCT_URI=mongodb://localhost/product_db
RABBITMQ_URI=amqp://localhost:5672
```

### Order Service

```
PORT=3002
MONGODB_ORDER_URI=mongodb://localhost/order_db
RABBITMQ_URI=amqp://localhost:5672
```

## 4. Hướng dẫn cài đặt

1. Clone project

```
git clone https://github.com/<tên-user>/microservices-ecommerce.git
cd microservices-ecommerce
```

2. Cài đặt dependencies

```
cd auth && npm install
cd ../product && npm install
cd ../order && npm install
```

3. Khởi động RabbitMQ

```
docker run -d --hostname rabbitmq --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

Truy cập http://localhost:15672 (user: guest / pass: guest)

4. Chạy từng service

```
cd auth && npm start
cd product && npm start
cd order && npm start
```

## 5. Quy trình hoạt động

1. Người dùng đăng nhập qua Auth Service và nhận JWT token.
2. Gửi yêu cầu mua hàng tới Product Service.
3. Product Service gửi thông tin đơn hàng sang RabbitMQ queue "orders".
4. Order Service nhận message, xử lý và lưu đơn hàng vào MongoDB.
5. Order Service gửi phản hồi sang queue "products".
6. Product Service nhận phản hồi và cập nhật trạng thái đơn hàng.

## 6. Ưu điểm kiến trúc

- Phân tách trách nhiệm rõ ràng.
- Dễ mở rộng và bảo trì.
- RabbitMQ đảm bảo dữ liệu không bị mất.
- Giao tiếp bất đồng bộ, hiệu năng cao.
- Sử dụng JWT để tăng tính bảo mật.

## 7. Hướng phát triển

- Thêm API Gateway tổng hợp service.
- Tích hợp Prometheus + Grafana để giám sát.
- Docker Compose để khởi chạy toàn bộ hệ thống.
- Tích hợp Kafka thay RabbitMQ cho luồng dữ liệu lớn.
- Xây dựng giao diện quản lý đơn hàng.
