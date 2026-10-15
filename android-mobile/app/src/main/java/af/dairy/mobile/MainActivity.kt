package af.dairy.mobile

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject
import java.time.LocalDate

private data class AppPage(
    val key: String,
    val label: String,
    val endpoint: String? = null,
    val icon: String,
)

private data class InputField(val key: String, val label: String, val numeric: Boolean = false)

private val pages = listOf(
    AppPage("dashboard", "داشبورد", icon = "⌂"),
    AppPage("suppliers", "شیرآور", "suppliers", "♙"),
    AppPage("milk", "ثبت شیر", "milk", "◉"),
    AppPage("sales", "فروش", "sales", "↗"),
    AppPage("expenses", "مصارف", "expenses", "−"),
    AppPage("products", "محصولات", "products", "▦"),
    AppPage("settings", "تنظیمات", "settings", "⚙"),
)

private val fieldsByPage = mapOf(
    "suppliers" to listOf(InputField("name", "نام شیرآور"), InputField("phone", "شماره تماس")),
    "milk" to listOf(
        InputField("supplierId", "شناسه شیرآور", true),
        InputField("recordDate", "تاریخ (YYYY-MM-DD)"),
        InputField("quantityKg", "مقدار (کیلوگرم)", true),
        InputField("pricePerKg", "قیمت هر کیلو", true),
        InputField("notes", "یادداشت"),
    ),
    "sales" to listOf(
        InputField("description", "شرح فروش"),
        InputField("quantity", "تعداد", true),
        InputField("totalAmount", "مبلغ کل", true),
        InputField("saleDate", "تاریخ (YYYY-MM-DD)"),
        InputField("notes", "یادداشت"),
    ),
    "expenses" to listOf(
        InputField("title", "عنوان هزینه"),
        InputField("category", "دسته‌بندی"),
        InputField("amount", "مبلغ", true),
        InputField("expenseDate", "تاریخ (YYYY-MM-DD)"),
        InputField("notes", "یادداشت"),
    ),
    "products" to listOf(InputField("name", "نام محصول")),
)

private fun JSONObject.displayRows(keys: List<Pair<String, String>>): List<String> =
    keys.mapNotNull { (key, label) ->
        val value = optString(key).takeIf { it.isNotBlank() && it != "null" } ?: return@mapNotNull null
        "$label: $value"
    }

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { DairyMobileApp() }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DairyMobileApp() {
    val context = LocalContext.current
    val preferences = remember { context.getSharedPreferences("dairy-mobile", 0) }
    var darkMode by remember { mutableStateOf(preferences.getBoolean("dark-mode", false)) }
    var pageKey by remember { mutableStateOf("dashboard") }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf("") }
    var message by remember { mutableStateOf("") }
    var showStorageDialog by remember { mutableStateOf(false) }
    var showEntryDialog by remember { mutableStateOf(false) }
    var rows by remember { mutableStateOf<List<List<String>>>(emptyList()) }
    var dashboard by remember { mutableStateOf<JSONObject?>(null) }
    var settings by remember { mutableStateOf<JSONObject?>(null) }
    var settingsName by remember { mutableStateOf("") }
    var settingsPhone by remember { mutableStateOf("") }
    var settingsAddress by remember { mutableStateOf("") }
    val formValues = remember { mutableStateMapOf<String, String>() }
    val localDatabase = remember { LocalDairyDatabase(context.applicationContext) }
    val scope = rememberCoroutineScope()
    val page = pages.first { it.key == pageKey }
    val today = remember { LocalDate.now().toString() }
    val entryFields = fieldsByPage[pageKey].orEmpty()

    val loadPage: suspend (String) -> Unit = { targetPage ->
        busy = true
        error = ""
        message = ""
        try {
            when (targetPage) {
                "dashboard" -> dashboard = localDatabase.getObject("dashboard?date=$today")
                "settings" -> {
                    val loadedSettings = localDatabase.getObject("settings")
                    settings = loadedSettings
                    settingsName = loadedSettings.optString("dairy_name")
                    settingsPhone = loadedSettings.optString("phone")
                    settingsAddress = loadedSettings.optString("address")
                }
                else -> {
                    val payload = localDatabase.get(pages.first { it.key == targetPage }.endpoint!!)
                    val records = if (payload is JSONArray) payload else (payload as JSONObject).optJSONArray("records") ?: JSONArray()
                    val fieldKeys = when (targetPage) {
                        "suppliers" -> listOf("id" to "شناسه", "name" to "نام", "phone" to "تماس")
                        "milk" -> listOf("record_date" to "تاریخ", "supplier_name" to "شیرآور", "quantity_kg" to "کیلوگرم", "total_cost" to "هزینه")
                        "sales" -> listOf("sale_date" to "تاریخ", "description" to "شرح", "quantity" to "تعداد", "total_amount" to "مبلغ")
                        "expenses" -> listOf("expense_date" to "تاریخ", "title" to "عنوان", "category" to "دسته", "amount" to "مبلغ")
                        else -> listOf("name" to "نام محصول")
                    }
                    rows = (0 until records.length()).map { index ->
                        records.getJSONObject(index).displayRows(fieldKeys)
                    }
                }
            }
        } catch (exception: Exception) {
            error = exception.message ?: "ارتباط با سرور برقرار نشد."
        } finally {
            busy = false
        }
    }

    LaunchedEffect(pageKey) { loadPage(pageKey) }

    MaterialTheme(colorScheme = if (darkMode) darkColorScheme(
        primary = Color(0xFF54D6A0),
        onPrimary = Color(0xFF062B1B),
        background = Color(0xFF0B1220),
        surface = Color(0xFF111C2E),
        onSurface = Color(0xFFE2E8F0),
        surfaceVariant = Color(0xFF1B2A3D),
    ) else lightColorScheme(
        primary = Color(0xFF087A50),
        onPrimary = Color.White,
        background = Color(0xFFF4F7F5),
        surface = Color.White,
        onSurface = Color(0xFF17231D),
        surfaceVariant = Color(0xFFEAF2ED),
    )) {
        CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
            Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                Scaffold(
                    containerColor = MaterialTheme.colorScheme.background,
                    contentWindowInsets = WindowInsets(0, 0, 0, 0),
                    topBar = {
                        Column {
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(horizontal = 18.dp, vertical = 14.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween,
                            ) {
                                Column {
                                    Text("مدیریت لبنیات", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                                    Text(page.label, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.primary)
                                }
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    TextButton(onClick = {
                                        darkMode = !darkMode
                                        preferences.edit().putBoolean("dark-mode", darkMode).apply()
                                    }) { Text(if (darkMode) "روشن" else "تاریک") }
                                    OutlinedButton(onClick = { showStorageDialog = true }) { Text("ذخیره محلی") }
                                }
                            }
                            HorizontalDivider(color = MaterialTheme.colorScheme.surfaceVariant)
                            androidx.compose.foundation.lazy.LazyRow(
                                modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 8.dp),
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                            ) {
                                items(pages) { item ->
                                    if (pageKey == item.key) {
                                        Button(onClick = { pageKey = item.key }) { Text("${item.icon}  ${item.label}") }
                                    } else {
                                        TextButton(onClick = { pageKey = item.key }) { Text("${item.icon}  ${item.label}") }
                                    }
                                }
                            }
                        }
                    },
                ) { padding ->
                    LazyColumn(
                        modifier = Modifier.fillMaxSize().padding(padding).padding(horizontal = 16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        item {
                            Spacer(Modifier.height(4.dp))
                            if (error.isNotBlank()) {
                                InfoCard(
                                    title = "ارتباط با سرور برقرار نشد",
                                    body = error,
                                    isError = true,
                                    action = { scope.launch { loadPage(pageKey) } },
                                )
                            }
                            if (message.isNotBlank()) {
                                InfoCard(title = "انجام شد", body = message)
                            }
                        }

                        when (pageKey) {
                            "dashboard" -> {
                                val data = dashboard
                                if (busy && data == null) {
                                    item { LoadingCard() }
                                } else if (data != null) {
                                    item {
                                        Text(today, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    }
                                    item {
                                        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                            MetricCard("شیر دریافتی", "${data.optDouble("totalMilkKg")} کیلوگرم")
                                            MetricCard("فروش امروز", "${data.optDouble("totalSales")} افغانی")
                                            MetricCard("هزینه خرید شیر", "${data.optDouble("milkPurchaseCost")} افغانی")
                                            MetricCard("مصارف امروز", "${data.optDouble("totalExpenses")} افغانی")
                                            MetricCard("سود روزانه", "${data.optDouble("profit")} افغانی", positive = true)
                                            MetricCard("زیان روزانه", "${data.optDouble("loss")} افغانی", positive = false)
                                        }
                                    }
                                }
                            }
                            "settings" -> {
                                item {
                                    ConnectionSettings(
                                        settings = settings,
                                        dairyName = settingsName,
                                        phone = settingsPhone,
                                        address = settingsAddress,
                                        onDairyNameChange = { settingsName = it },
                                        onPhoneChange = { settingsPhone = it },
                                        onAddressChange = { settingsAddress = it },
                                        onSaveSettings = {
                                            scope.launch {
                                                busy = true
                                                error = ""
                                                try {
                                                    settings = localDatabase.put(
                                                        "settings",
                                                        JSONObject()
                                                            .put("dairyName", settingsName)
                                                            .put("phone", settingsPhone)
                                                            .put("address", settingsAddress),
                                                    )
                                                    message = "تنظیمات با موفقیت ذخیره شد."
                                                } catch (exception: Exception) {
                                                    error = exception.message ?: "ذخیره تنظیمات انجام نشد."
                                                } finally {
                                                    busy = false
                                                }
                                            }
                                        },
                                    )
                                }
                            }
                            else -> {
                                item {
                                    Row(
                                        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically,
                                    ) {
                                        Text("سوابق ${page.label}", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                            TextButton(onClick = { scope.launch { loadPage(pageKey) } }) { Text("تازه‌سازی") }
                                            if (entryFields.isNotEmpty()) {
                                                Button(onClick = {
                                                    formValues.clear()
                                                    if (pageKey == "milk") formValues["recordDate"] = today
                                                    if (pageKey == "sales") formValues["saleDate"] = today
                                                    if (pageKey == "expenses") formValues["expenseDate"] = today
                                                    showEntryDialog = true
                                                }) { Text("+ ثبت") }
                                            }
                                        }
                                    }
                                }
                                if (busy && rows.isEmpty()) {
                                    item { LoadingCard() }
                                } else if (rows.isEmpty()) {
                                    item { InfoCard(title = "موردی ثبت نشده", body = "پس از ثبت اطلاعات، سوابق این بخش در اینجا نمایش داده می‌شوند.") }
                                } else {
                                    items(rows) { fields ->
                                        Card(
                                            modifier = Modifier.fillMaxWidth(),
                                            shape = RoundedCornerShape(18.dp),
                                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                                        ) {
                                            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                                                fields.forEachIndexed { index, value ->
                                                    Text(
                                                        value,
                                                        style = if (index == 0) MaterialTheme.typography.titleSmall else MaterialTheme.typography.bodyMedium,
                                                        fontWeight = if (index == 0) FontWeight.Bold else FontWeight.Normal,
                                                    )
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        item { Spacer(Modifier.height(20.dp)) }
                    }
                }
            }
        }
    }

    if (showStorageDialog) {
        AlertDialog(
            onDismissRequest = { showStorageDialog = false },
            title = { Text("ذخیره‌سازی روی موبایل") },
            text = { Text("اطلاعات در پایگاه داده داخلی همین گوشی ذخیره می‌شود و برای ثبت یا مشاهده آن‌ها به اینترنت یا سرور جداگانه نیاز نیست.") },
            confirmButton = { Button(onClick = { showStorageDialog = false }) { Text("متوجه شدم") } },
        )
    }

    if (showEntryDialog) {
        AlertDialog(
            onDismissRequest = { showEntryDialog = false },
            title = { Text("ثبت ${page.label}") },
            text = {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(entryFields) { field ->
                        OutlinedTextField(
                            value = formValues[field.key].orEmpty(),
                            onValueChange = { formValues[field.key] = it },
                            label = { Text(field.label) },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = if (field.numeric) KeyboardType.Decimal else KeyboardType.Text),
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    enabled = !busy,
                    onClick = {
                        scope.launch {
                            busy = true
                            error = ""
                            try {
                                val body = JSONObject()
                                entryFields.forEach { field ->
                                    val value = formValues[field.key].orEmpty().trim()
                                    if (field.numeric && value.isNotBlank()) {
                                        body.put(field.key, value.toDoubleOrNull() ?: value.toIntOrNull() ?: value)
                                    } else {
                                        body.put(field.key, value)
                                    }
                                }
                                localDatabase.post(page.endpoint!!, body)
                                showEntryDialog = false
                                message = "اطلاعات با موفقیت ثبت شد."
                                loadPage(pageKey)
                            } catch (exception: Exception) {
                                error = exception.message ?: "ثبت اطلاعات انجام نشد."
                            } finally {
                                busy = false
                            }
                        }
                    },
                ) { Text(if (busy) "در حال ثبت..." else "ذخیره") }
            },
            dismissButton = { TextButton(onClick = { showEntryDialog = false }) { Text("لغو") } },
        )
    }
}

@Composable
private fun MetricCard(label: String, value: String, positive: Boolean? = null) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 18.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Text(label, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(
                value,
                color = if (positive == true) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface,
                fontWeight = FontWeight.Bold,
            )
        }
    }
}

@Composable
private fun InfoCard(title: String, body: String, isError: Boolean = false, action: (() -> Unit)? = null) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isError) MaterialTheme.colorScheme.errorContainer else MaterialTheme.colorScheme.surface,
        ),
    ) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(title, fontWeight = FontWeight.Bold)
            Text(body, style = MaterialTheme.typography.bodySmall)
            if (action != null) TextButton(onClick = action) { Text("تلاش دوباره") }
        }
    }
}

@Composable
private fun LoadingCard() {
    Box(Modifier.fillMaxWidth().padding(28.dp), contentAlignment = Alignment.Center) {
        CircularProgressIndicator(modifier = Modifier.size(30.dp))
    }
}

@Composable
private fun ConnectionSettings(
    settings: JSONObject?,
    dairyName: String,
    phone: String,
    address: String,
    onDairyNameChange: (String) -> Unit,
    onPhoneChange: (String) -> Unit,
    onAddressChange: (String) -> Unit,
    onSaveSettings: () -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(18.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        ) {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("پایگاه داده داخلی", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Text(
                    "اطلاعات این اپ به‌صورت محلی روی همین موبایل ذخیره می‌شود و بدون اینترنت نیز در دسترس است.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
        settings?.let {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            ) {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("اطلاعات لبنیات", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    OutlinedTextField(
                        value = dairyName,
                        onValueChange = onDairyNameChange,
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("نام لبنیات") },
                        singleLine = true,
                    )
                    OutlinedTextField(
                        value = phone,
                        onValueChange = onPhoneChange,
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("شماره تماس") },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                    )
                    OutlinedTextField(
                        value = address,
                        onValueChange = onAddressChange,
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("آدرس") },
                    )
                    Button(onClick = onSaveSettings) { Text("ذخیره اطلاعات") }
                }
            }
        }
    }
}
