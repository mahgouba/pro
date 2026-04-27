#!/bin/bash

# Array of remaining luxury vehicles to add
vehicles=(
  '{"manufacturer":"لكزس","category":"RX350","trimLevel":"فل كامل","engineCapacity":"3.5L V6","year":2024,"exteriorColor":"رمادي معدني","interiorColor":"أسود مع تطعيمات","status":"متوفر","importType":"شركة","ownershipType":"ملك الشركة","location":"المعرض","chassisNumber":"LX2024005RX3","price":"285000.00","notes":"لكزس RX350 SUV عائلي فاخر"}'
  '{"manufacturer":"لكزس","category":"IS300","trimLevel":"ستاندرد","engineCapacity":"2.0L Turbo","year":2023,"exteriorColor":"أبيض صدفي","interiorColor":"بني جلد","status":"متوفر","importType":"شخصي","ownershipType":"ملك الشركة","location":"المستودع الرئيسي","chassisNumber":"LX2023006IS3","price":"205000.00","notes":"لكزس IS300 سيدان رياضي"}'
  '{"manufacturer":"لكزس","category":"NX300","trimLevel":"خاص","engineCapacity":"2.0L Turbo","year":2023,"exteriorColor":"أحمر كاردينال","interiorColor":"أسود جلد","status":"في الطريق","importType":"شركة","ownershipType":"ملك الشركة","location":"الميناء","chassisNumber":"LX2023007NX3","price":"225000.00","notes":"لكزس NX300 SUV مدمج"}'
  '{"manufacturer":"جينيسيس","category":"GV70","trimLevel":"فل كامل","engineCapacity":"2.5L Turbo","year":2024,"exteriorColor":"أسود لامع","interiorColor":"بيج مع خيوط رمادية","status":"متوفر","importType":"شركة","ownershipType":"ملك الشركة","location":"المعرض","chassisNumber":"GN2024004GV7","price":"285000.00","notes":"جينيسيس GV70 SUV متوسط فاخر"}'
  '{"manufacturer":"جينيسيس","category":"G80","trimLevel":"خاص","engineCapacity":"3.5L V6","year":2023,"exteriorColor":"فضي معدني","interiorColor":"أحمر جلد طبيعي","status":"متوفر","importType":"شخصي","ownershipType":"ملك الشركة","location":"المعرض","chassisNumber":"GN2023005G80","price":"315000.00","notes":"جينيسيس G80 سيدان تنفيذي"}'
  '{"manufacturer":"نيسان","category":"إكس تيرا","trimLevel":"فل كامل","engineCapacity":"4.0L V6","year":2024,"exteriorColor":"أخضر عسكري","interiorColor":"أسود مع تطعيمات برتقالية","status":"متوفر","importType":"شركة","ownershipType":"ملك الشركة","location":"المعرض","chassisNumber":"NS2024004XTR","price":"165000.00","notes":"نيسان إكس تيرا SUV للمغامرات"}'
  '{"manufacturer":"نيسان","category":"مكسيما","trimLevel":"ستاندرد","engineCapacity":"3.5L V6","year":2023,"exteriorColor":"أزرق عميق","interiorColor":"بيج جلد","status":"متوفر","importType":"شخصي","ownershipType":"ملك الشركة","location":"المستودع الرئيسي","chassisNumber":"NS2023005MAX","price":"125000.00","notes":"نيسان مكسيما سيدان كبير"}'
  '{"manufacturer":"نيسان","category":"قاشقاي","trimLevel":"خاص","engineCapacity":"2.0L","year":2023,"exteriorColor":"أحمر متألق","interiorColor":"أسود قماش","status":"في الطريق","importType":"مستعمل شخصي","ownershipType":"ملك الشركة","location":"الميناء","chassisNumber":"NS2023006QSH","price":"95000.00","notes":"نيسان قاشقاي كروس أوفر مستعمل"}'
  '{"manufacturer":"لاند روفر","category":"ديسكفري","trimLevel":"فل كامل","engineCapacity":"3.0L V6","year":2024,"exteriorColor":"أخضر بريطاني","interiorColor":"بني جلد فاخر","status":"متوفر","importType":"شركة","ownershipType":"ملك الشركة","location":"المعرض","chassisNumber":"RR2024006DSC","price":"385000.00","notes":"لاند روفر ديسكفري للعائلة والمغامرات"}'
  '{"manufacturer":"لاند روفر","category":"ديفندر","trimLevel":"خاص","engineCapacity":"2.0L Turbo","year":2023,"exteriorColor":"أصفر صحراوي","interiorColor":"أسود مقاوم للماء","status":"متوفر","importType":"شخصي","ownershipType":"ملك الشركة","location":"المعرض","chassisNumber":"RR2023007DFN","price":"295000.00","notes":"لاند روفر ديفندر الأسطوري"}'
  '{"manufacturer":"مرسيدس","category":"GLA250","trimLevel":"فل كامل","engineCapacity":"2.0L Turbo","year":2024,"exteriorColor":"أبيض أركتيك","interiorColor":"أحمر جلد","status":"متوفر","importType":"شركة","ownershipType":"ملك الشركة","location":"المعرض","chassisNumber":"MB2024008GLA","price":"225000.00","notes":"مرسيدس GLA250 SUV مدمج أنيق"}'
  '{"manufacturer":"مرسيدس","category":"GLB200","trimLevel":"ستاندرد","engineCapacity":"1.3L Turbo","year":2023,"exteriorColor":"رمادي جرافيت","interiorColor":"أسود قماش","status":"متوفر","importType":"شخصي","ownershipType":"ملك الشركة","location":"المستودع الرئيسي","chassisNumber":"MB2023009GLB","price":"195000.00","notes":"مرسيدس GLB200 SUV سبعة مقاعد"}'
  '{"manufacturer":"مرسيدس","category":"GLC300","trimLevel":"خاص","engineCapacity":"2.0L Turbo","year":2024,"exteriorColor":"أزرق كافانسيت","interiorColor":"بيج مع خشب الجوز","status":"في الطريق","importType":"شركة","ownershipType":"ملك الشركة","location":"الميناء","chassisNumber":"MB2024010GLC","price":"315000.00","notes":"مرسيدس GLC300 SUV متوسط فاخر"}'
  '{"manufacturer":"بنتلي","category":"مولسان","trimLevel":"فل كامل","engineCapacity":"6.75L V8","year":2023,"exteriorColor":"بورجوندي معدني","interiorColor":"كريمي مع خيوط ذهبية","status":"متوفر","importType":"شخصي","ownershipType":"معرض (وسيط)","location":"المعرض","chassisNumber":"BT2023004MUL","price":"1850000.00","notes":"بنتلي مولسان الفئة الأرستقراطية"}'
  '{"manufacturer":"بنتلي","category":"كونتيننتال GTC","trimLevel":"خاص","engineCapacity":"4.0L V8","year":2024,"exteriorColor":"أخضر بريطاني","interiorColor":"بني غامق مع خشب الماهوجني","status":"محجوز","importType":"شركة","ownershipType":"ملك الشركة","location":"المعرض","chassisNumber":"BT2024005GTC","price":"1125000.00","reservedBy":"admin","reservationNote":"محجوز لعميل مميز","notes":"بنتلي كونتيننتال GTC كشف فاخر"}'
)

echo "🚗 بدء إضافة المزيد من السيارات الفاخرة..."

count=0
for vehicle in "${vehicles[@]}"; do
  echo "إضافة السيارة رقم $((count + 1))..."
  curl -s -X POST http://localhost:5000/api/inventory \
    -H "Content-Type: application/json" \
    -d "$vehicle" > /dev/null &
  
  count=$((count + 1))
  
  # Add a small delay every 5 vehicles
  if (( count % 5 == 0 )); then
    wait
    sleep 0.5
  fi
done

wait
echo "✅ تم إضافة $count سيارة إضافية بنجاح!"
echo "📊 إجمالي السيارات المضافة حتى الآن: حوالي 30 سيارة"