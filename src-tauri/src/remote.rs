use std::net::TcpStream;
use ssh2::Session;
use serde::{Serialize, Deserialize};
use std::io::Read;
use std::path::Path;

#[derive(Serialize, Deserialize)]
pub struct RemoteFile {
    pub name: String,
    pub path: String,
    pub file_type: String, // "file" or "directory"
    pub size: u64,
    pub modified: u64,
}

#[tauri::command]
pub async fn remote_ssh_connect(
    host: String,
    port: u16,
    username: String,
    password: Option<String>,
    key_path: Option<String>,
) -> Result<String, String> {
    let tcp = TcpStream::connect(format!("{}:{}", host, port)).map_err(|e| e.to_string())?;
    let mut sess = Session::new().map_err(|e| e.to_string())?;
    sess.set_tcp_stream(tcp);
    sess.handshake().map_err(|e| e.to_string())?;

    if let Some(pwd) = password {
        sess.userauth_password(&username, &pwd).map_err(|e| e.to_string())?;
    } else if let Some(kp) = key_path {
        sess.userauth_pubkey_file(&username, None, Path::new(&kp), None).map_err(|e| e.to_string())?;
    } else {
        return Err("No authentication method provided".to_string());
    }

    if sess.authenticated() {
        Ok("Authenticated successfully".to_string())
    } else {
        Err("Authentication failed".to_string())
    }
}

#[tauri::command]
pub async fn remote_ssh_list_dir(
    host: String,
    port: u16,
    username: String,
    password: Option<String>,
    key_path: Option<String>,
    path: String,
) -> Result<Vec<RemoteFile>, String> {
    let tcp = TcpStream::connect(format!("{}:{}", host, port)).map_err(|e| e.to_string())?;
    let mut sess = Session::new().map_err(|e| e.to_string())?;
    sess.set_tcp_stream(tcp);
    sess.handshake().map_err(|e| e.to_string())?;

    if let Some(pwd) = password {
        sess.userauth_password(&username, &pwd).map_err(|e| e.to_string())?;
    } else if let Some(kp) = key_path {
        sess.userauth_pubkey_file(&username, None, Path::new(&kp), None).map_err(|e| e.to_string())?;
    }

    let sftp = sess.sftp().map_err(|e| e.to_string())?;
    let entries = sftp.readdir(Path::new(&path)).map_err(|e| e.to_string())?;

    let mut files = Vec::new();
    for (p, stat) in entries {
        let name = p.file_name().and_then(|n| n.to_str()).unwrap_or("unknown").to_string();
        files.push(RemoteFile {
            name,
            path: p.to_str().unwrap_or("").to_string(),
            file_type: if stat.is_dir() { "directory".to_string() } else { "file".to_string() },
            size: stat.size.unwrap_or(0),
            modified: stat.mtime.unwrap_or(0),
        });
    }

    Ok(files)
}

#[tauri::command]
pub async fn remote_ssh_read_file(
    host: String,
    port: u16,
    username: String,
    password: Option<String>,
    key_path: Option<String>,
    path: String,
) -> Result<String, String> {
    let tcp = TcpStream::connect(format!("{}:{}", host, port)).map_err(|e| e.to_string())?;
    let mut sess = Session::new().map_err(|e| e.to_string())?;
    sess.set_tcp_stream(tcp);
    sess.handshake().map_err(|e| e.to_string())?;

    if let Some(pwd) = password {
        sess.userauth_password(&username, &pwd).map_err(|e| e.to_string())?;
    } else if let Some(kp) = key_path {
        sess.userauth_pubkey_file(&username, None, Path::new(&kp), None).map_err(|e| e.to_string())?;
    }

    let sftp = sess.sftp().map_err(|e| e.to_string())?;
    let mut file = sftp.open(Path::new(&path)).map_err(|e| e.to_string())?;
    let mut content = String::new();
    file.read_to_string(&mut content).map_err(|e| e.to_string())?;

    Ok(content)
}

#[tauri::command]
pub async fn remote_ssh_exec_command(
    host: String,
    port: u16,
    username: String,
    password: Option<String>,
    key_path: Option<String>,
    command: String,
) -> Result<String, String> {
    let tcp = TcpStream::connect(format!("{}:{}", host, port)).map_err(|e| e.to_string())?;
    let mut sess = Session::new().map_err(|e| e.to_string())?;
    sess.set_tcp_stream(tcp);
    sess.handshake().map_err(|e| e.to_string())?;

    if let Some(pwd) = password {
        sess.userauth_password(&username, &pwd).map_err(|e| e.to_string())?;
    } else if let Some(kp) = key_path {
        sess.userauth_pubkey_file(&username, None, Path::new(&kp), None).map_err(|e| e.to_string())?;
    }

    let mut channel = sess.channel_session().map_err(|e| e.to_string())?;
    channel.exec(&command).map_err(|e| e.to_string())?;
    
    let mut s = String::new();
    channel.read_to_string(&mut s).map_err(|e| e.to_string())?;
    
    let mut err = String::new();
    channel.stderr().read_to_string(&mut err).ok();

    channel.wait_close().map_err(|e| e.to_string())?;
    
    if s.is_empty() && !err.is_empty() {
        return Ok(err);
    }
    
    Ok(format!("{}{}", s, err))
}

#[tauri::command]
pub async fn remote_ssh_upload(
    host: String,
    port: u16,
    username: String,
    password: Option<String>,
    key_path: Option<String>,
    remote_path: String,
    content: Vec<u8>,
) -> Result<String, String> {
    let tcp = TcpStream::connect(format!("{}:{}", host, port)).map_err(|e| e.to_string())?;
    let mut sess = Session::new().map_err(|e| e.to_string())?;
    sess.set_tcp_stream(tcp);
    sess.handshake().map_err(|e| e.to_string())?;

    if let Some(pwd) = password {
        sess.userauth_password(&username, &pwd).map_err(|e| e.to_string())?;
    } else if let Some(kp) = key_path {
        sess.userauth_pubkey_file(&username, None, Path::new(&kp), None).map_err(|e| e.to_string())?;
    }

    let sftp = sess.sftp().map_err(|e| e.to_string())?;
    use std::io::Write;
    let mut remote_file = sftp.create(Path::new(&remote_path)).map_err(|e| e.to_string())?;
    remote_file.write_all(&content).map_err(|e| e.to_string())?;
    
    Ok("Uploaded successfully".to_string())
}

#[tauri::command]
pub async fn remote_ssh_download(
    host: String,
    port: u16,
    username: String,
    password: Option<String>,
    key_path: Option<String>,
    remote_path: String,
) -> Result<Vec<u8>, String> {
    let tcp = TcpStream::connect(format!("{}:{}", host, port)).map_err(|e| e.to_string())?;
    let mut sess = Session::new().map_err(|e| e.to_string())?;
    sess.set_tcp_stream(tcp);
    sess.handshake().map_err(|e| e.to_string())?;

    if let Some(pwd) = password {
        sess.userauth_password(&username, &pwd).map_err(|e| e.to_string())?;
    } else if let Some(kp) = key_path {
        sess.userauth_pubkey_file(&username, None, Path::new(&kp), None).map_err(|e| e.to_string())?;
    }

    let sftp = sess.sftp().map_err(|e| e.to_string())?;
    let mut file = sftp.open(Path::new(&remote_path)).map_err(|e| e.to_string())?;
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer).map_err(|e| e.to_string())?;
    
    Ok(buffer)
}

#[tauri::command]
pub async fn remote_ssh_create_dir(
    host: String,
    port: u16,
    username: String,
    password: Option<String>,
    key_path: Option<String>,
    remote_path: String,
) -> Result<String, String> {
    let tcp = TcpStream::connect(format!("{}:{}", host, port)).map_err(|e| e.to_string())?;
    let mut sess = Session::new().map_err(|e| e.to_string())?;
    sess.set_tcp_stream(tcp);
    sess.handshake().map_err(|e| e.to_string())?;

    if let Some(pwd) = password {
        sess.userauth_password(&username, &pwd).map_err(|e| e.to_string())?;
    } else if let Some(kp) = key_path {
        sess.userauth_pubkey_file(&username, None, Path::new(&kp), None).map_err(|e| e.to_string())?;
    }

    let sftp = sess.sftp().map_err(|e| e.to_string())?;
    sftp.mkdir(Path::new(&remote_path), 0o755).map_err(|e| e.to_string())?;

    Ok("Directory created".to_string())
}

#[tauri::command]
pub async fn remote_ssh_delete_file(
    host: String,
    port: u16,
    username: String,
    password: Option<String>,
    key_path: Option<String>,
    remote_path: String,
    is_dir: bool,
) -> Result<String, String> {
    let tcp = TcpStream::connect(format!("{}:{}", host, port)).map_err(|e| e.to_string())?;
    let mut sess = Session::new().map_err(|e| e.to_string())?;
    sess.set_tcp_stream(tcp);
    sess.handshake().map_err(|e| e.to_string())?;

    if let Some(pwd) = password {
        sess.userauth_password(&username, &pwd).map_err(|e| e.to_string())?;
    } else if let Some(kp) = key_path {
        sess.userauth_pubkey_file(&username, None, Path::new(&kp), None).map_err(|e| e.to_string())?;
    }

    let sftp = sess.sftp().map_err(|e| e.to_string())?;
    
    if is_dir {
        sftp.rmdir(Path::new(&remote_path)).map_err(|e| e.to_string())?;
    } else {
        sftp.unlink(Path::new(&remote_path)).map_err(|e| e.to_string())?;
    }

    Ok("Deleted successfully".to_string())
}
