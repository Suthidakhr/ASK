from datetime import date, datetime, timezone

TODAY = date.today().strftime("%d %b %Y")

NEWS_DATA = [
    {
        "id": "news-001",
        "title": "เฟดส่งสัญญาณลดดอกเบี้ย 2 ครั้งในปี 2025 หลังเงินเฟ้อ CPI ชะลอตัวดีกว่าคาด",
        "summary": "ธนาคารกลางสหรัฐฯ (Fed) แสดงสัญญาณชัดเจนถึงแนวโน้มลดอัตราดอกเบี้ย 2 ครั้งในปีนี้ หลังดัชนี CPI เดือนพฤษภาคมอยู่ที่ 3.1% ต่ำกว่าที่ตลาดคาดไว้ที่ 3.3% ส่งผลบวกต่อตลาดหุ้นและตราสารหนี้ทั่วโลก",
        "category": "ดอกเบี้ยโลก",
        "published_at": datetime(2026, 6, 21, 1, 15, tzinfo=timezone.utc),
        "source": "Bloomberg",
        "ai_analysis": "สัญญาณบวกที่ชัดเจน: ดอกเบี้ยขาลงหนุนตลาดหุ้นโดยรวม โดยเฉพาะกลุ่มที่มี P/E สูงและหุ้นปันผลสม่ำเสมอ กลุ่มธนาคารไทยอาจถูกกดดันระยะสั้น แต่หุ้นอสังหาฯ และสาธารณูปโภคได้รับผลบวก",
        "stock_impacts": [
            {"symbol": "SPALI", "direction": "positive"},
            {"symbol": "LH", "direction": "positive"},
            {"symbol": "EGCO", "direction": "positive"},
            {"symbol": "RATCH", "direction": "positive"},
            {"symbol": "KBANK", "direction": "neutral"},
            {"symbol": "SCB", "direction": "neutral"},
        ],
        "featured": True,
    },
    {
        "id": "news-002",
        "title": "OPEC+ ประกาศยืดการลดกำลังผลิต 2.2 ล้านบาร์เรล/วัน ถึงสิ้นปี — น้ำมันดิบพุ่ง 2.1%",
        "summary": "กลุ่ม OPEC+ มีมติขยายเวลาลดกำลังผลิตน้ำมันดิบสมัครใจ 2.2 ล้านบาร์เรลต่อวันออกไปถึงสิ้นปี 2025 ราคา Brent Crude พุ่งขึ้นแตะ $86.40 ต่อบาร์เรล",
        "category": "พลังงาน",
        "published_at": datetime(2026, 6, 21, 2, 42, tzinfo=timezone.utc),
        "source": "Reuters",
        "ai_analysis": "ผลบวกชัดเจนต่อหุ้นกลุ่มพลังงานไทย โดยเฉพาะ PTT, PTTEP และ TOP ที่ราคาน้ำมันดิบสูงขึ้นช่วยเพิ่ม margin แต่ต้องระวังผลกระทบต้นทุนต่อกลุ่มสายการบินและโรงพยาบาล",
        "stock_impacts": [
            {"symbol": "PTTEP", "direction": "positive"},
            {"symbol": "TOP", "direction": "positive"},
            {"symbol": "PTT", "direction": "positive"},
            {"symbol": "AAV", "direction": "negative"},
            {"symbol": "THAI", "direction": "negative"},
        ],
        "featured": False,
    },
    {
        "id": "news-003",
        "title": "ครม. อนุมัติงบลงทุนโครงสร้างพื้นฐาน 3.2 แสนล้านบาท หนุนรถไฟฟ้า-ทางหลวงพิเศษ",
        "summary": "คณะรัฐมนตรีไฟเขียวงบประมาณลงทุนโครงสร้างพื้นฐานวงเงิน 320,000 ล้านบาท ประกอบด้วยโครงการรถไฟฟ้าสายใหม่ 4 เส้นทาง ทางหลวงพิเศษ และพัฒนาสนามบินภูมิภาค",
        "category": "หุ้นไทย",
        "published_at": datetime(2026, 6, 21, 3, 18, tzinfo=timezone.utc),
        "source": "SET",
        "ai_analysis": "ผลบวกระยะยาวต่อกลุ่มรับเหมาก่อสร้างและวัสดุก่อสร้าง บริษัทที่มีประวัติงานภาครัฐจะ outperform ตลาดในช่วง 6-12 เดือนข้างหน้า",
        "stock_impacts": [
            {"symbol": "ITD", "direction": "positive"},
            {"symbol": "CK", "direction": "positive"},
            {"symbol": "STEC", "direction": "positive"},
            {"symbol": "SCC", "direction": "positive"},
        ],
        "featured": False,
    },
    {
        "id": "news-004",
        "title": "NVIDIA ทุบสถิติรายได้ Q2 แตะ $35.1B โตกว่า 122% YoY — AI Chip demand ยังแกร่ง",
        "summary": "NVIDIA รายงานผลประกอบการไตรมาส 2 ด้วยรายได้ $35.1 พันล้านดอลลาร์ เกินประมาณการนักวิเคราะห์ที่ $33.7B กำไรสุทธิโต 168% YoY",
        "category": "เทคโนโลยี",
        "published_at": datetime(2026, 6, 21, 4, 5, tzinfo=timezone.utc),
        "source": "CNBC",
        "ai_analysis": "ส่งผลบวกต่อความเชื่อมั่นตลาด Semiconductor โดยรวม กลุ่มไทยที่ได้รับอานิสงส์คือ Delta Electronics และกลุ่ม EMS อย่าง HANA",
        "stock_impacts": [
            {"symbol": "DELTA", "direction": "positive"},
            {"symbol": "HANA", "direction": "positive"},
            {"symbol": "KCE", "direction": "positive"},
            {"symbol": "INSET", "direction": "neutral"},
        ],
        "featured": False,
    },
    {
        "id": "news-005",
        "title": "จีนปล่อย stimulus package ใหม่ 1 ล้านล้านหยวน กระตุ้นอสังหาฯ และการบริโภค",
        "summary": "รัฐบาลจีนประกาศมาตรการกระตุ้นเศรษฐกิจรอบใหม่มูลค่า 1 ล้านล้านหยวน โฟกัสภาคอสังหาริมทรัพย์ การบริโภคในประเทศ และโครงสร้างพื้นฐานสีเขียว",
        "category": "ตลาดโลก",
        "published_at": datetime(2026, 6, 21, 5, 30, tzinfo=timezone.utc),
        "source": "Financial Times",
        "ai_analysis": "ผลบวกต่อการส่งออกไทยไปจีนและท่องเที่ยว คาดนักท่องเที่ยวจีน +18% H2 กลุ่มค้าปลีกและโรงแรมได้ประโยชน์สูงสุด",
        "stock_impacts": [
            {"symbol": "AOT", "direction": "positive"},
            {"symbol": "MINT", "direction": "positive"},
            {"symbol": "ERW", "direction": "positive"},
            {"symbol": "TU", "direction": "positive"},
            {"symbol": "IVL", "direction": "positive"},
        ],
        "featured": False,
    },
]

MARKET_INDICES = [
    {"name": "SET Index", "symbol": "SET", "price": 1384.52, "change": 8.21, "change_pct": 0.60, "market": "ตลาดหลักทรัพย์ไทย"},
    {"name": "S&P 500", "symbol": "SPX", "price": 5541.20, "change": 24.10, "change_pct": 0.44, "market": "ตลาดหุ้นสหรัฐฯ"},
    {"name": "Hang Seng", "symbol": "HSI", "price": 18472.30, "change": 312.40, "change_pct": 1.72, "market": "ตลาดฮ่องกง"},
    {"name": "Nikkei 225", "symbol": "NKY", "price": 38947.00, "change": -124.50, "change_pct": -0.32, "market": "ตลาดญี่ปุ่น"},
    {"name": "Gold Spot", "symbol": "XAUUSD", "price": 2389.80, "change": -12.30, "change_pct": -0.51, "market": "USD/oz"},
    {"name": "USD/THB", "symbol": "USDTHB", "price": 36.42, "change": -0.08, "change_pct": -0.22, "market": "อัตราแลกเปลี่ยน"},
]

SECTORS = [
    {"name": "ก่อสร้าง", "change_pct": 2.41, "level": "strong_up"},
    {"name": "ท่องเที่ยว", "change_pct": 1.87, "level": "up"},
    {"name": "อสังหาฯ", "change_pct": 1.62, "level": "up"},
    {"name": "พลังงาน", "change_pct": 1.34, "level": "up"},
    {"name": "ธนาคาร", "change_pct": 0.22, "level": "flat"},
    {"name": "ค้าปลีก", "change_pct": 0.15, "level": "flat"},
    {"name": "เกษตร", "change_pct": -0.08, "level": "flat"},
    {"name": "สายการบิน", "change_pct": -1.21, "level": "down"},
    {"name": "ปิโตรเคมี", "change_pct": -0.74, "level": "down"},
]

TRENDS = [
    {
        "rank": 1,
        "title": "Fed Pivot ใกล้เข้ามา — ลดดอกเบี้ยรอบแรกใน Q3",
        "description": "ตลาดตอบรับด้วย Risk-on mode กลุ่ม Growth stocks และหุ้นปันผลสูงได้รับความสนใจ",
        "sentiment": "bullish",
    },
    {
        "rank": 2,
        "title": "จีนฟื้นตัว — demand สินค้าไทยโต",
        "description": "กลุ่มส่งออกและท่องเที่ยวได้รับแรงหนุนจาก stimulus แดนมังกร คาดนักท่องเที่ยวจีน +18% H2",
        "sentiment": "bullish",
    },
    {
        "rank": 3,
        "title": "ต้นทุนพลังงานสูง — กดดัน margin กลุ่มใช้น้ำมัน",
        "description": "น้ำมัน Brent เหนือ $86 กดดันกลุ่มสายการบินและโรงงานอุตสาหกรรมพลังงานสูง",
        "sentiment": "bearish",
    },
    {
        "rank": 4,
        "title": "โครงสร้างพื้นฐาน — theme ลงทุนระยะยาว",
        "description": "งบภาครัฐ 3.2 แสนล้านบาทเป็นตัวเร่งสำคัญ กลุ่มรับเหมาและวัสดุก่อสร้างมีโอกาสเด่น",
        "sentiment": "bullish",
    },
]

AI_SUMMARY = {
    "date": TODAY,
    "overview": "วันนี้ตลาดหุ้นไทยมีแนวโน้มบวก ขับเคลื่อนจากปัจจัยภายนอกหลักคือสัญญาณลดดอกเบี้ยของ Fed และ stimulus จีน ในขณะที่ราคาน้ำมันที่สูงขึ้นเป็นดาบสองคม",
    "key_points": [
        "กลุ่มที่น่าสนใจวันนี้: ท่องเที่ยว, ก่อสร้าง, อสังหาฯ",
        "กลุ่มที่ต้องระวัง: สายการบิน, กลุ่มใช้พลังงานสูง",
        "SET คาดเคลื่อนไหวในกรอบ 1,378–1,395 จุด",
        "ค่าเงินบาทแข็งค่าจาก capital inflow หลัง Fed signal",
    ],
    "watch_sectors": ["ท่องเที่ยว", "ก่อสร้าง", "อสังหาฯ"],
    "avoid_sectors": ["สายการบิน", "ปิโตรเคมี"],
    "set_range_low": 1378.0,
    "set_range_high": 1395.0,
}

TICKER_DATA = [
    {"symbol": "SET", "price": 1384.52, "change": 8.21, "change_pct": 0.60},
    {"symbol": "PTT", "price": 32.50, "change": -0.25, "change_pct": -0.76},
    {"symbol": "AOT", "price": 64.75, "change": 1.25, "change_pct": 1.97},
    {"symbol": "SCB", "price": 108.50, "change": 2.00, "change_pct": 1.88},
    {"symbol": "CPALL", "price": 55.25, "change": -0.50, "change_pct": -0.90},
    {"symbol": "MINT", "price": 29.75, "change": 0.75, "change_pct": 2.59},
    {"symbol": "KBANK", "price": 143.00, "change": 1.50, "change_pct": 1.06},
    {"symbol": "S&P500", "price": 5541.20, "change": 24.10, "change_pct": 0.44},
    {"symbol": "GOLD", "price": 2389.80, "change": -12.30, "change_pct": -0.51},
    {"symbol": "USD/THB", "price": 36.42, "change": -0.08, "change_pct": -0.22},
]
