/**
 * Danh sách các dịp cố định trong năm
 * Các dịp này được hardcode và hiển thị khi chọn chức năng
 */
export const ANNUAL_OCCASIONS = [
  {
    id: "tet-nguyen-dan",
    name: "Tết Nguyên Đán",
    description: "Phát quà Tết cho các hộ gia đình",
    defaultDate: "28/12 ÂL", // 28 tháng Chạp (Âm lịch)
    type: "ANNUAL",
    icon: "🎊",
    targetAge: null, // Tất cả mọi người
    rewardDescription: "1 bộ quà Tết (bánh kẹo, trà, rượu)",
  },
  {
    id: "tet-trung-thu",
    name: "Trung Thu",
    description: "Phát quà Trung Thu cho trẻ em",
    defaultDate: "15/08 ÂL", // 15 tháng 8 Âm lịch
    type: "ANNUAL",
    icon: "🌕",
    targetAge: { min: 0, max: 18 }, // Trẻ em 0-18 tuổi
    rewardDescription: "1 bộ quà Trung Thu (bánh trung thu, đèn lồng, đồ chơi)",
  },
  {
    id: "quoc-te-thieu-nhi",
    name: "Quốc tế Thiếu nhi",
    description: "Phát quà ngày Quốc tế Thiếu nhi 1/6",
    defaultDate: "01/06",
    type: "ANNUAL",
    icon: "🎈",
    targetAge: { min: 0, max: 14 }, // Trẻ em 0-14 tuổi
    rewardDescription: "1 phần quà (đồ chơi, sách vở, bánh kẹo)",
  },
  {
    id: "tet-doan-ngo",
    name: "Tết Đoan Ngọ",
    description: "Phát quà Tết Đoan Ngọ (5/5 Âm lịch)",
    defaultDate: "05/05 ÂL",
    type: "ANNUAL",
    icon: "🍙",
    targetAge: null,
    rewardDescription: "1 phần quà (bánh tro, rượu nếp)",
  },
  {
    id: "quoc-khanh",
    name: "Quốc khánh",
    description: "Phát quà kỷ niệm Quốc khánh 2/9",
    defaultDate: "02/09",
    type: "ANNUAL",
    icon: "🇻🇳",
    targetAge: null,
    rewardDescription: "200.000 VNĐ tiền mặt",
  },
  {
    id: "tet-duong-lich",
    name: "Tết Dương lịch",
    description: "Phát quà Tết Dương lịch 1/1",
    defaultDate: "01/01",
    type: "ANNUAL",
    icon: "🎉",
    targetAge: null,
    rewardDescription: "1 phần quà (bánh kẹo, trà)",
  },
  {
    id: "ngay-phu-nu-viet-nam",
    name: "Ngày Phụ nữ Việt Nam",
    description: "Phát quà kỷ niệm Ngày Phụ nữ Việt Nam 20/10",
    defaultDate: "20/10",
    type: "ANNUAL",
    icon: "🌸",
    targetAge: null,
    targetGender: "FEMALE", // Chỉ phụ nữ
    rewardDescription: "1 phần quà (hoa, mỹ phẩm, quà tặng)",
  },
  {
    id: "ngay-nha-giao-viet-nam",
    name: "Ngày Nhà giáo Việt Nam",
    description: "Phát quà kỷ niệm Ngày Nhà giáo Việt Nam 20/11",
    defaultDate: "20/11",
    type: "ANNUAL",
    icon: "📚",
    targetAge: null,
    rewardDescription: "1 phần quà (hoa, sách, quà tặng)",
  },
  {
    id: "ngay-quan-doi-nhan-dan",
    name: "Ngày Quân đội Nhân dân",
    description: "Phát quà kỷ niệm Ngày Quân đội Nhân dân 22/12",
    defaultDate: "22/12",
    type: "ANNUAL",
    icon: "🎖️",
    targetAge: null,
    rewardDescription: "200.000 VNĐ tiền mặt",
  },
  {
    id: "tet-nguyen-tieu",
    name: "Tết Nguyên Tiêu",
    description: "Phát quà Tết Nguyên Tiêu (Rằm tháng Giêng)",
    defaultDate: "15/01 ÂL",
    type: "ANNUAL",
    icon: "🏮",
    targetAge: null,
    rewardDescription: "1 phần quà (bánh kẹo, trà)",
  },
  {
    id: "tet-han-thuc",
    name: "Tết Hàn Thực",
    description: "Phát quà Tết Hàn Thực (3/3 Âm lịch)",
    defaultDate: "03/03 ÂL",
    type: "ANNUAL",
    icon: "🍡",
    targetAge: null,
    rewardDescription: "1 phần quà (bánh trôi, bánh chay)",
  },
  {
    id: "tet-thanh-minh",
    name: "Tết Thanh Minh",
    description: "Phát quà Tết Thanh Minh",
    defaultDate: "05/04",
    type: "ANNUAL",
    icon: "🌿",
    targetAge: null,
    rewardDescription: "1 phần quà (bánh kẹo, trà)",
  },
  {
    id: "valentine",
    name: "Valentine",
    description: "Phát quà ngày Valentine 14/2",
    defaultDate: "14/02",
    type: "ANNUAL",
    icon: "💝",
    targetAge: null,
    rewardDescription: "1 phần quà (hoa, socola, quà tặng)",
  },
  {
    id: "cach-mang-thang-tam",
    name: "Cách mạng tháng Tám",
    description: "Phát quà kỷ niệm Cách mạng tháng Tám 19/8",
    defaultDate: "19/08",
    type: "ANNUAL",
    icon: "🎖️",
    targetAge: null,
    rewardDescription: "200.000 VNĐ tiền mặt",
  },
  {
    id: "gio-to-hung-vuong",
    name: "Giỗ tổ Hùng Vương",
    description: "Phát quà kỷ niệm Giỗ tổ Hùng Vương 10/3 ÂL",
    defaultDate: "10/03 ÂL",
    type: "ANNUAL",
    icon: "🏛️",
    targetAge: null,
    rewardDescription: "1 phần quà (bánh kẹo, trà)",
  },
  {
    id: "giai-phong-mien-nam",
    name: "Giải phóng miền Nam",
    description: "Phát quà kỷ niệm Giải phóng miền Nam 30/4",
    defaultDate: "30/04",
    type: "ANNUAL",
    icon: "🇻🇳",
    targetAge: null,
    rewardDescription: "200.000 VNĐ tiền mặt",
  },
  {
    id: "quoc-te-lao-dong",
    name: "Quốc tế Lao động",
    description: "Phát quà kỷ niệm Quốc tế Lao động 1/5",
    defaultDate: "01/05",
    type: "ANNUAL",
    icon: "👷",
    targetAge: null,
    rewardDescription: "200.000 VNĐ tiền mặt",
  },
];

/**
 * Lấy danh sách dịp theo loại
 */
export const getOccasionsByType = (type) => {
  return ANNUAL_OCCASIONS.filter((occasion) => occasion.type === type);
};

/**
 * Lấy dịp theo ID
 */
export const getOccasionById = (id) => {
  return ANNUAL_OCCASIONS.find((occasion) => occasion.id === id);
};

