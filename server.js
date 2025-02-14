const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

// Kết nối MongoDB
mongoose.connect('mongodb://localhost:27017/marketplace', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('Failed to connect MongoDB', err));

// Tạo schema sản phẩm
const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  description: String,
  imageUrl: String,
  owner: String,
  state: String
});

const Product = mongoose.model('Product', productSchema);

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));  // Chia sẻ thư mục 'uploads'

// Kiểm tra và tạo thư mục 'uploads' nếu chưa tồn tại
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log('Created uploads directory');
}

// Cấu hình Multer để lưu ảnh vào 'uploads'
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);  // Lưu ảnh vào thư mục tuyệt đối
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Endpoint tạo sản phẩm mới
app.post('/api/products', upload.single('image'), async (req, res) => {
  const { name, price, description, owner, state } = req.body;

  // Trả về URL đầy đủ của ảnh nếu có
  const imageUrl = req.file 
  ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` 
  : '';


  const newProduct = new Product({
    name,
    price,
    description,
    imageUrl,
    owner,
    state
  });

  try {
    await newProduct.save();
    res.json({ success: true, product: newProduct });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint lấy thông tin sản phẩm theo itemId
// Endpoint lấy thông tin sản phẩm theo tên
app.get('/api/products/name/:name', async (req, res) => {
  try {
      const { name } = req.params; // Lấy tên từ URL
      const product = await Product.findOne({ name }); // Tìm sản phẩm theo tên

      if (!product) {
          return res.status(404).json({ success: false, message: 'Product not found' });
      }

      // Trả về thông tin sản phẩm
      res.json({
          success: true,
          description: product.description,
          image: product.imageUrl // Trả về URL của ảnh
      });
  } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({ success: false, message: 'Server error' });
  }
});

  
// Khởi động server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
