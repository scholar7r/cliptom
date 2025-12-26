// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

#[tauri::command]
fn handle_convert(value: &str, separators: Vec<char>, prefix: &str, suffix: &str) -> String {
    fn mapper(digit: char) -> char {
        match digit {
            '0' => '零',
            '1' => '一',
            '2' => '二',
            '3' => '三',
            '4' => '四',
            '5' => '五',
            '6' => '六',
            '7' => '七',
            '8' => '八',
            '9' => '九',
            _ => digit,
        }
    }

    fn convert(s: &str) -> String {
        if s.is_empty() {
            return s.to_string();
        }

        let chars: Vec<char> = s.chars().collect();
        let length = chars.len();

        let mut indices: Vec<usize> = (0..length).collect();

        indices.sort_by(|&a, &b| {
            let ia = (a as i32 - length as i32 / 2).abs();
            let ib = (b as i32 - length as i32 / 2).abs();
            ia.cmp(&ib)
        });

        let mut converted_placement = Vec::new();

        let target = 1;

        for &i in &indices {
            if chars[i].is_ascii_digit() && chars[i] != '0' && chars[i] != '1' {
                converted_placement.push(i);
                if converted_placement.len() == target {
                    break;
                }
            }
        }

        if converted_placement.len() < target {
            for &i in &indices {
                if chars[i].is_ascii_digit() {
                    converted_placement.push(i);
                    if converted_placement.len() == target {
                        break;
                    }
                }
            }
        }

        let mut result = chars.clone();
        for &i in &converted_placement {
            result[i] = mapper(result[i]);
        }

        result.into_iter().collect()
    }

    let separator = value.chars().find(|c| separators.contains(c));

    match separator {
        Some(s) => {
            let parts: Vec<&str> = value.splitn(2, s).collect();
            if parts.len() == 2 {
                let converted_contact = convert(parts[0]);
                let converted_suffix = convert(parts[1]);
                format!(
                    "{}{}{}{}{}",
                    prefix, converted_contact, s, converted_suffix, suffix
                )
            } else {
                let converted = convert(value);
                format!("{}{}{}", prefix, converted, suffix)
            }
        }
        None => {
            let converted = convert(value);
            format!("{}{}{}", prefix, converted, suffix)
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![handle_convert])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
