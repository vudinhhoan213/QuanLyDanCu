import * as XLSX from "xlsx";

/**
 * Export data to Excel file
 * @param {Array} data - Array of objects to export
 * @param {Array} columns - Array of column definitions with {key, title, render}
 * @param {String} filename - Name of the file (without extension)
 */
export const exportToExcel = (data, columns, filename = "export") => {
  try {
    // Transform data based on columns
    const worksheetData = data.map((item, index) => {
      const row = { STT: index + 1 };
      columns.forEach((col) => {
        if (col.key === "index") return; // Skip index column
        const value = item[col.key] || item[col.dataIndex];
        if (col.render) {
          // For complex renders, try to extract text value
          // This is a simplified version - you may need to adjust based on your data
          row[col.title] = value;
        } else {
          row[col.title] = value;
        }
      });
      return row;
    });

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    // Auto-size columns
    const maxWidth = 50;
    const colWidths = [];
    worksheetData.forEach((row) => {
      Object.keys(row).forEach((key, idx) => {
        const value = String(row[key] || "");
        if (!colWidths[idx] || value.length > colWidths[idx]) {
          colWidths[idx] = Math.min(value.length, maxWidth);
        }
      });
    });
    worksheet["!cols"] = colWidths.map((w) => ({ wch: w + 2 }));

    // Save file
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    return true;
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    throw error;
  }
};

/**
 * Export registrations to Excel with custom formatting
 */
export const exportRegistrationsToExcel = (registrations, eventName) => {
  try {
    const worksheetData = registrations.map((reg, index) => ({
      STT: index + 1,
      "Họ tên": reg.citizen?.fullName || "N/A",
      "CMND/CCCD": reg.citizen?.nationalId || "N/A",
      "Hộ khẩu": reg.household?.code || "N/A",
      "Số điện thoại": reg.citizen?.phone || reg.household?.phone || "N/A",
      "Thời gian nhận": reg.distributedAt
        ? new Date(reg.distributedAt).toLocaleString("vi-VN")
        : reg.createdAt
        ? new Date(reg.createdAt).toLocaleString("vi-VN")
        : "-",
      "Số lượng": reg.quantity || 1,
      "Giá trị đơn vị": reg.unitValue
        ? `${reg.unitValue.toLocaleString("vi-VN")} VNĐ`
        : "N/A",
      "Tổng giá trị": reg.totalValue
        ? `${reg.totalValue.toLocaleString("vi-VN")} VNĐ`
        : "N/A",
      "Ghi chú": reg.note || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();

    // Set column widths
    worksheet["!cols"] = [
      { wch: 5 }, // STT
      { wch: 25 }, // Họ tên
      { wch: 15 }, // CMND/CCCD
      { wch: 15 }, // Hộ khẩu
      { wch: 15 }, // Số điện thoại
      { wch: 20 }, // Thời gian nhận
      { wch: 10 }, // Số lượng
      { wch: 18 }, // Giá trị đơn vị
      { wch: 18 }, // Tổng giá trị
      { wch: 30 }, // Ghi chú
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách đăng ký");

    // Generate filename with event name and date
    const dateStr = new Date().toISOString().split("T")[0];
    const safeEventName = (eventName || "Su-kien")
      .replace(/[^a-zA-Z0-9]/g, "-")
      .substring(0, 30);
    const filename = `Danh-sach-dang-ky-${safeEventName}-${dateStr}`;

    XLSX.writeFile(workbook, `${filename}.xlsx`);
    return true;
  } catch (error) {
    console.error("Error exporting registrations to Excel:", error);
    throw error;
  }
};

/**
 * Export events list to Excel
 */
export const exportEventsToExcel = (events) => {
  try {
    const worksheetData = events.map((event, index) => ({
      STT: index + 1,
      "Tên sự kiện": event.name || "N/A",
      "Loại":
        event.type === "ANNUAL"
          ? "Thường niên"
          : event.type === "SPECIAL"
          ? "Đặc biệt"
          : event.type || "N/A",
      "Ngày bắt đầu": event.startDate
        ? new Date(event.startDate).toLocaleDateString("vi-VN")
        : event.date
        ? new Date(event.date).toLocaleDateString("vi-VN")
        : "N/A",
      "Ngày kết thúc": event.endDate
        ? new Date(event.endDate).toLocaleDateString("vi-VN")
        : "N/A",
      "Số người đăng ký": event.registeredCount || 0,
      "Số người nhận quà": event.distributedCount || 0,
      "Tỷ lệ nhận quà": `${event.distributedCount || 0} / ${event.registeredCount || 0}`,
      "Trạng thái":
        event.status === "OPEN"
          ? "Mở"
          : event.status === "CLOSED"
          ? "Đóng"
          : event.status === "EXPIRED"
          ? "Hết hạn"
          : event.status === "ENDED"
          ? "Đã kết thúc"
          : event.status || "N/A",
      "Ngân sách": event.budget
        ? `${event.budget.toLocaleString("vi-VN")} VNĐ`
        : "N/A",
      "Mô tả": event.description || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();

    // Set column widths
    worksheet["!cols"] = [
      { wch: 5 }, // STT
      { wch: 30 }, // Tên sự kiện
      { wch: 15 }, // Loại
      { wch: 15 }, // Ngày bắt đầu
      { wch: 15 }, // Ngày kết thúc
      { wch: 15 }, // Số người đăng ký
      { wch: 15 }, // Số người nhận quà
      { wch: 15 }, // Tỷ lệ nhận quà
      { wch: 15 }, // Trạng thái
      { wch: 20 }, // Ngân sách
      { wch: 40 }, // Mô tả
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách sự kiện");

    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `Danh-sach-su-kien-${dateStr}`;

    XLSX.writeFile(workbook, `${filename}.xlsx`);
    return true;
  } catch (error) {
    console.error("Error exporting events to Excel:", error);
    throw error;
  }
};

