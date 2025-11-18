/**
 * Danh sách các dịp cố định trong năm
 * Các dịp này được hardcode và hiển thị khi chọn chức năng
 * Đã tối ưu cho tổ dân phố bình thường - chỉ giữ các sự kiện phổ biến nhất
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

