# Xây dựng hệ thống quản lý đào tạo sau đại học tích hợp AI Tutor và phân tích dữ liệu học vụ

Ứng dụng quản lý hồ sơ học viên, học phần, tiến độ, đề tài, hội đồng và đơn học vụ. AI Tutor tra cứu quy chế có trích dẫn. Trang phân tích tổng hợp dữ liệu học vụ trong PostgreSQL.

## Chạy demo bằng Docker Compose

Cần Docker Compose và Node.js 20 trở lên. Từ thư mục gốc, tạo `.env` một lần theo mẫu `.env.example`. Ví dụ với PowerShell:

```powershell
if (-not (Test-Path -LiteralPath .env)) {
  $demoDbPassword = node -e "console.log(require('node:crypto').randomBytes(24).toString('hex'))"
  $demoJwtSecret = node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
  @("DB_PASSWORD=$demoDbPassword", "JWT_SECRET=$demoJwtSecret") | Set-Content -LiteralPath .env -Encoding ascii
}
docker compose up -d --build
```

Mở [giao diện demo](http://localhost:8080) và [Swagger](http://localhost:3000/api/docs). Khi backend đã khởi động và chạy migration, nạp seed vào CSDL demo riêng:

```powershell
docker compose exec -T db psql -U qldt_dev -d qldt_saudaihoc -v ON_ERROR_STOP=1 --single-transaction -f /seed.sql
```

| Vai trò | Email demo |
| --- | --- |
| Quản trị viên | `admin@example.test` |
| Giảng viên | `giangvien01@example.test` |
| Học viên | `hocvien01@example.test` |

Mật khẩu các tài khoản demo là `DemoSauDaiHoc2026`. Danh tính, công bố và hồ sơ trong seed là dữ liệu hư cấu. Seed từ chối nạp nếu CSDL đã có tài khoản ngoài miền demo. Với CSDL mới riêng, có thể tạo quản trị viên bằng `docker compose exec backend node dist/config/create-admin.js admin@example.edu.vn`.

OpenRouter là tùy chọn. Để trống `OPENROUTER_API_KEY` để chạy chế độ tra cứu quy chế cục bộ. Các cổng Compose chỉ lắng nghe trên máy chạy.

## Chạy trực tiếp bằng Node.js

Cần PostgreSQL 16 có tiện ích `pgvector`. Sao chép `backend/.env.example` thành `backend/.env` và điền thông tin CSDL riêng. Từ thư mục gốc, chạy:

```powershell
npm ci
npm --prefix backend ci
npm --prefix frontend ci
npm run dev
```

Mở [frontend](http://localhost:5173). Backend tự chạy migration lúc khởi động. Có thể chạy riêng bằng `npm --prefix backend run migration:run`. `database/schema.sql` là schema tham khảo. Các migration trong `backend/src/migrations` dùng để khởi tạo phiên bản hiện tại.


## Kịch bản nghiệm thu

1. **Học phần.** Phòng đào tạo mở mục Nhập điểm để phân công giảng viên theo học phần và học kỳ, đồng thời cấu hình số tín chỉ học phần cần đạt trước khi bảo vệ. Giảng viên chỉ lấy được danh sách và nhập điểm theo phân công.
2. **Đề tài và minh chứng.** Học viên nộp đề cương và báo cáo. Phòng đào tạo xét từng minh chứng, ghi lý do khi yêu cầu bổ sung. Hồ sơ tiến sĩ có bước đánh giá tại đơn vị chuyên môn và xác nhận kết quả phản biện độc lập. Tài liệu phản biện chỉ mở cho Phòng đào tạo.
3. **Hội đồng.** Chọn quy chế theo khóa khi lập hội đồng, ghi đúng thời điểm và địa điểm. Các thành viên nộp phiếu từ thời điểm đánh giá. Phòng đào tạo ghi nhận người có mặt, đính kèm biên bản và chốt kết quả. Hệ thống dùng phiếu cho luận án tiến sĩ và dùng điểm trung bình theo quy chế 2021 đối với luận văn thạc sĩ. Phiên đánh giá lại chỉ mở khi đủ điều kiện.
4. **Đơn học vụ.** Học viên nộp đơn bảo lưu, gia hạn hoặc quay lại học trong Hồ sơ học vụ. Người hướng dẫn cho ý kiến, Phòng đào tạo phê duyệt và nhập số quyết định.
5. **AI Tutor.** Tra cứu một câu theo TT 53/2026, mở văn bản gốc từ câu trả lời và kiểm tra lịch sử sau khi tải lại trang. Thiết lập `OPENROUTER_API_KEY` để bật sinh câu trả lời qua OpenRouter. Khi chưa có khóa hoặc mô hình lỗi, ứng dụng hiển thị nội dung truy hồi trực tiếp.

## Phạm vi quy chế và dữ liệu

- Thông tư 18/2021 và 23/2021 được giữ cho hồ sơ chuyển tiếp. [Thông tư 53/2026](https://vanban.chinhphu.vn/?docid=218880&pageid=27160) áp dụng với các khóa thông báo tuyển sinh từ ngày 01/01/2027. Phòng đào tạo cần đối chiếu thông báo tuyển sinh, quy định chuyển tiếp và chuẩn chương trình trước khi chọn quy chế.
- Tín chỉ trước bảo vệ do Phòng đào tạo cấu hình. Công bố, ngoại ngữ, kết quả phản biện và liêm chính học thuật có bước thẩm tra minh chứng. Điểm tương đồng và kết quả Crossref không tự xác nhận các tiêu chí này.
- Phòng đào tạo có thể nhập hạn nộp theo kế hoạch ở trang chi tiết đề tài. Đơn gia hạn điều chỉnh hạn nộp. Quyết định bảo lưu cập nhật thời gian nghỉ, còn lịch bảo vệ do Phòng đào tạo quản lý.
- Công cụ đối sánh so văn bản với tối đa 300 đề tài đã bảo vệ trong CSDL. Khi người dùng chọn tra Crossref, ứng dụng gửi tiêu đề đã nhập để tìm thông tin công bố và DOI. Mốc 20% là mốc tham khảo của công cụ.
- Kho AI dùng TF-IDF và từ khóa, có thể dùng pgvector để điều chỉnh thứ hạng các đoạn đã tìm thấy. Link trong kho dẫn đến văn bản gốc. Phạm vi nguồn là các điều khoản đã biên tập và tài liệu mà Phòng đào tạo nhập.
- Ứng viên tạo tài khoản từ màn hình đăng nhập và nộp đơn tại Hồ sơ học vụ. Phòng đào tạo duyệt kèm PDF quyết định trúng tuyển, sau đó xác nhận nhập học với mã học viên, khóa và chuyên ngành. Mã SHA-256 lưu khi duyệt dùng để đối chiếu nội dung tệp quyết định. Hồ sơ đã lưu mã theo cách cũ cần được thẩm tra bằng tệp gốc.
- Sau khi bảo vệ đạt, Phòng đào tạo có thể ghi nhận quyết định công nhận tốt nghiệp đã ban hành ở trang chi tiết đề tài. Hệ thống kiểm tra kết quả hội đồng, học phần và minh chứng ngoại ngữ. Học viên xem quyết định trong Hồ sơ học vụ.
- Điểm cảnh báo học vụ dùng để theo dõi hồ sơ. Tương quan điểm chỉ dùng kết quả hội đồng cấp trường và điểm báo cáo đã chấm. Chỉ số đồng tác giả chỉ có thể tính khi có dữ liệu tác giả đã xác minh.
- Mật khẩu khởi tạo sinh ngẫu nhiên được trả về khi tạo từng tài khoản. Với tài khoản nhập hàng loạt, quản trị viên dùng thao tác đặt lại mật khẩu khi bàn giao.
- Tệp tải lên trong Docker nằm trên volume riêng. Khi cập nhật một bản cài đang có tệp trong thư mục uploads cũ, sao lưu và chuyển chúng sang volume mới để giữ đường dẫn hiện có.

## Kiểm tra mã nguồn

```powershell
npm --prefix backend test -- --runInBand
npm run build:all
```
