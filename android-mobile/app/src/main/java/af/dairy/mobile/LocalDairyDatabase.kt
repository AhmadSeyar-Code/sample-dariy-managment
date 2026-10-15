package af.dairy.mobile

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteConstraintException
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject

internal class LocalDairyDatabase(context: Context) :
    SQLiteOpenHelper(context, "dairy_management.db", null, 1) {

    override fun onConfigure(db: SQLiteDatabase) {
        db.setForeignKeyConstraintsEnabled(true)
    }

    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL(
            """CREATE TABLE settings (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                dairy_name TEXT NOT NULL DEFAULT 'لبنیات افغان',
                phone TEXT NOT NULL DEFAULT '',
                address TEXT NOT NULL DEFAULT ''
            )""",
        )
        db.execSQL(
            """CREATE TABLE suppliers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone TEXT NOT NULL UNIQUE,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )""",
        )
        db.execSQL(
            """CREATE TABLE milk_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                supplier_id INTEGER NOT NULL,
                record_date TEXT NOT NULL,
                quantity_kg REAL NOT NULL CHECK (quantity_kg > 0),
                price_per_kg REAL NOT NULL CHECK (price_per_kg > 0),
                total_cost REAL NOT NULL,
                notes TEXT,
                FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
            )""",
        )
        db.execSQL(
            """CREATE TABLE sales (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                description TEXT NOT NULL,
                quantity REAL NOT NULL CHECK (quantity > 0),
                total_amount REAL NOT NULL CHECK (total_amount > 0),
                sale_date TEXT NOT NULL,
                notes TEXT
            )""",
        )
        db.execSQL(
            """CREATE TABLE expenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                category TEXT NOT NULL,
                amount REAL NOT NULL CHECK (amount > 0),
                expense_date TEXT NOT NULL,
                notes TEXT
            )""",
        )
        db.execSQL(
            """CREATE TABLE products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )""",
        )
        db.execSQL(
            "INSERT INTO settings (id, dairy_name, phone, address) VALUES (1, 'لبنیات افغان', '', '')",
        )
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        // Database upgrades are added here when the local schema changes.
    }

    suspend fun get(endpoint: String): Any = withContext(Dispatchers.IO) {
        val path = endpoint.substringBefore('?').trim('/')
        val db = readableDatabase
        when (path) {
            "settings" -> settingsJson(db)
            "suppliers" -> queryJson(
                db,
                "SELECT id, name, phone, created_at FROM suppliers ORDER BY id DESC",
            )
            "milk" -> queryJson(
                db,
                """SELECT m.id, m.supplier_id, s.name AS supplier_name, m.record_date,
                    m.quantity_kg, m.price_per_kg, m.total_cost, m.notes
                    FROM milk_records m JOIN suppliers s ON s.id = m.supplier_id
                    ORDER BY m.record_date DESC, m.id DESC""",
            )
            "sales" -> queryJson(
                db,
                "SELECT id, description, quantity, total_amount, sale_date, notes FROM sales ORDER BY sale_date DESC, id DESC",
            )
            "expenses" -> queryJson(
                db,
                "SELECT id, title, category, amount, expense_date, notes FROM expenses ORDER BY expense_date DESC, id DESC",
            )
            "products" -> queryJson(db, "SELECT id, name, created_at FROM products ORDER BY id DESC")
            else -> throw IllegalArgumentException("این بخش شناخته نشد.")
        }
    }

    suspend fun getObject(endpoint: String): JSONObject = withContext(Dispatchers.IO) {
        when (endpoint.substringBefore('?').trim('/')) {
            "settings" -> settingsJson(readableDatabase)
            "dashboard" -> dashboardJson(endpoint.substringAfter("date=", "").substringBefore('&'))
            else -> throw IllegalArgumentException("اطلاعات این بخش پیدا نشد.")
        }
    }

    suspend fun post(endpoint: String, body: JSONObject): JSONObject = withContext(Dispatchers.IO) {
        val db = writableDatabase
        try {
            when (endpoint.trim('/')) {
                "suppliers" -> {
                    val name = body.optString("name").trim()
                    val phone = body.optString("phone").trim()
                    require(name.isNotEmpty()) { "نام شیرآور الزامی است." }
                    require(phone.isNotEmpty()) { "شماره تماس شیرآور الزامی است." }
                    val values = ContentValues().apply {
                        put("name", name)
                        put("phone", phone)
                    }
                    db.insertOrThrow("suppliers", null, values)
                    JSONObject().put("message", "شیرآور با موفقیت ثبت شد.")
                }
                "milk" -> {
                    val supplierId = body.optInt("supplierId")
                    val date = body.optString("recordDate").trim()
                    val quantity = body.optDouble("quantityKg", 0.0)
                    val price = body.optDouble("pricePerKg", 0.0)
                    require(supplierId > 0 && exists(db, "suppliers", supplierId)) { "شیرآور انتخاب‌شده معتبر نیست." }
                    require(date.isNotEmpty()) { "تاریخ دریافت شیر الزامی است." }
                    require(quantity > 0.0) { "مقدار شیر باید بیشتر از صفر باشد." }
                    require(price > 0.0) { "قیمت هر کیلو باید بیشتر از صفر باشد." }
                    val values = ContentValues().apply {
                        put("supplier_id", supplierId)
                        put("record_date", date)
                        put("quantity_kg", quantity)
                        put("price_per_kg", price)
                        put("total_cost", quantity * price)
                        put("notes", body.optString("notes").trim())
                    }
                    db.insertOrThrow("milk_records", null, values)
                    JSONObject().put("message", "رکورد شیر با موفقیت ثبت شد.")
                }
                "sales" -> {
                    val description = body.optString("description").trim()
                    val quantity = body.optDouble("quantity", 0.0)
                    val total = body.optDouble("totalAmount", 0.0)
                    val date = body.optString("saleDate").trim()
                    require(description.isNotEmpty()) { "شرح فروش الزامی است." }
                    require(quantity > 0.0) { "تعداد فروش باید بیشتر از صفر باشد." }
                    require(total > 0.0) { "مبلغ فروش باید بیشتر از صفر باشد." }
                    require(date.isNotEmpty()) { "تاریخ فروش الزامی است." }
                    val values = ContentValues().apply {
                        put("description", description)
                        put("quantity", quantity)
                        put("total_amount", total)
                        put("sale_date", date)
                        put("notes", body.optString("notes").trim())
                    }
                    db.insertOrThrow("sales", null, values)
                    JSONObject().put("message", "فروش با موفقیت ثبت شد.")
                }
                "expenses" -> {
                    val title = body.optString("title").trim()
                    val category = body.optString("category").trim()
                    val amount = body.optDouble("amount", 0.0)
                    val date = body.optString("expenseDate").trim()
                    require(title.isNotEmpty()) { "عنوان هزینه الزامی است." }
                    require(category.isNotEmpty()) { "دسته‌بندی هزینه الزامی است." }
                    require(amount > 0.0) { "مبلغ هزینه باید بیشتر از صفر باشد." }
                    require(date.isNotEmpty()) { "تاریخ هزینه الزامی است." }
                    val values = ContentValues().apply {
                        put("title", title)
                        put("category", category)
                        put("amount", amount)
                        put("expense_date", date)
                        put("notes", body.optString("notes").trim())
                    }
                    db.insertOrThrow("expenses", null, values)
                    JSONObject().put("message", "هزینه با موفقیت ثبت شد.")
                }
                "products" -> {
                    val name = body.optString("name").trim()
                    require(name.isNotEmpty()) { "نام محصول الزامی است." }
                    val values = ContentValues().apply { put("name", name) }
                    db.insertOrThrow("products", null, values)
                    JSONObject().put("message", "محصول با موفقیت ثبت شد.")
                }
                else -> throw IllegalArgumentException("این بخش امکان ثبت ندارد.")
            }
        } catch (exception: SQLiteConstraintException) {
            if (endpoint.trim('/') == "suppliers") {
                throw IllegalArgumentException("این شماره تماس قبلاً ثبت شده است.")
            }
            throw IllegalArgumentException("اطلاعات با محدودیت‌های ثبت سازگار نیست.")
        }
    }

    suspend fun put(endpoint: String, body: JSONObject): JSONObject = withContext(Dispatchers.IO) {
        require(endpoint.trim('/') == "settings") { "ویرایش این بخش پشتیبانی نمی‌شود." }
        val values = ContentValues().apply {
            put("dairy_name", body.optString("dairyName").trim())
            put("phone", body.optString("phone").trim())
            put("address", body.optString("address").trim())
        }
        writableDatabase.update("settings", values, "id = 1", null)
        settingsJson(readableDatabase)
    }

    private fun settingsJson(db: SQLiteDatabase): JSONObject =
        db.rawQuery("SELECT dairy_name, phone, address FROM settings WHERE id = 1", null).use { cursor ->
            check(cursor.moveToFirst()) { "تنظیمات لبنیات پیدا نشد." }
            JSONObject()
                .put("dairy_name", cursor.getString(0))
                .put("phone", cursor.getString(1))
                .put("address", cursor.getString(2))
        }

    private fun dashboardJson(date: String): JSONObject {
        require(date.isNotBlank()) { "تاریخ داشبورد نامعتبر است." }
        val db = readableDatabase
        val totalMilk = scalar(db, "SELECT COALESCE(SUM(quantity_kg), 0) FROM milk_records WHERE record_date = ?", date)
        val milkCost = scalar(db, "SELECT COALESCE(SUM(total_cost), 0) FROM milk_records WHERE record_date = ?", date)
        val expenses = scalar(db, "SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE expense_date = ?", date)
        val sales = scalar(db, "SELECT COALESCE(SUM(total_amount), 0) FROM sales WHERE sale_date = ?", date)
        val result = sales - milkCost - expenses
        return JSONObject()
            .put("date", date)
            .put("totalMilkKg", totalMilk)
            .put("milkPurchaseCost", milkCost)
            .put("totalExpenses", expenses)
            .put("totalSales", sales)
            .put("profit", result.coerceAtLeast(0.0))
            .put("loss", (-result).coerceAtLeast(0.0))
            .put("dailyResult", result)
    }

    private fun scalar(db: SQLiteDatabase, sql: String, argument: String): Double =
        db.rawQuery(sql, arrayOf(argument)).use { cursor ->
            if (cursor.moveToFirst()) cursor.getDouble(0) else 0.0
        }

    private fun exists(db: SQLiteDatabase, table: String, id: Int): Boolean =
        db.rawQuery("SELECT 1 FROM $table WHERE id = ?", arrayOf(id.toString())).use { it.moveToFirst() }

    private fun queryJson(db: SQLiteDatabase, sql: String): JSONArray =
        db.rawQuery(sql, null).use { cursor ->
            val result = JSONArray()
            while (cursor.moveToNext()) {
                val row = JSONObject()
                for (index in 0 until cursor.columnCount) {
                    if (cursor.isNull(index)) continue
                    val value: Any = when (cursor.getType(index)) {
                        android.database.Cursor.FIELD_TYPE_INTEGER -> cursor.getLong(index)
                        android.database.Cursor.FIELD_TYPE_FLOAT -> cursor.getDouble(index)
                        else -> cursor.getString(index)
                    }
                    row.put(cursor.getColumnName(index), value)
                }
                result.put(row)
            }
            result
        }
}
