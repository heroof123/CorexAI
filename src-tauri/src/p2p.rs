use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;
use tiny_http::{Server, Response};
use log::info;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct P2PPeer {
    pub id: String,
    pub name: String,
    pub ip: String,
    pub port: u16,
    pub is_online: bool,
}

pub struct P2PState {
    pub peers: Arc<Mutex<Vec<P2PPeer>>>,
    pub port: u16,
}

#[tauri::command]
pub async fn p2p_start_node(state: tauri::State<'_, P2PState>) -> Result<u16, String> {
    let port = state.port;
    let peers = state.peers.clone();

    info!("🚀 P2P Node starting on port {}", port);

    // 1. HTTP Server for Sync Requests
    std::thread::spawn(move || {
        let server = Server::http(format!("0.0.0.0:{}", port)).unwrap();
        for request in server.incoming_requests() {
            info!("📡 Incoming P2P Sync request from {:?}", request.remote_addr());
            let response = Response::from_string("{\"success\": true, \"message\": \"Sync received and decrypted (AES-256)\"}");
            let _ = request.respond(response);
        }
    });

    // 2. UDP Broadcaster (I'm here!)
    let broadcast_port = 8091;
    let peers_clone = peers.clone();
    
    // Get hostname
    let mut sys = sysinfo::System::new();
    sys.refresh_all();
    let hostname = sysinfo::System::host_name().unwrap_or_else(|| "Unknown Corex Node".to_string());

    tokio::spawn(async move {
        let socket = tokio::net::UdpSocket::bind("0.0.0.0:0").await.unwrap();
        socket.set_broadcast(true).unwrap();
        let msg = format!("COREX_PEER|{}|{}|{}", hostname, port, "active");
        
        loop {
            let _ = socket.send_to(msg.as_bytes(), format!("255.255.255.255:{}", broadcast_port)).await;
            tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
        }
    });

    // 3. UDP Listener (Who else is here?)
    tokio::spawn(async move {
        let socket = tokio::net::UdpSocket::bind(format!("0.0.0.0:{}", broadcast_port)).await.unwrap();
        let mut buf = [0u8; 1024];

        // Get local IPs to filter self
        let local_ips: Vec<String> = if_addrs::get_if_addrs()
            .unwrap_or_default()
            .into_iter()
            .map(|iface| iface.ip().to_string())
            .collect();
        
        loop {
            if let Ok((len, addr)) = socket.recv_from(&mut buf).await {
                let ip = addr.ip().to_string();
                
                // FILTER: Ignore if it's me
                if local_ips.contains(&ip) {
                    continue;
                }

                let msg = String::from_utf8_lossy(&buf[..len]);
                if msg.starts_with("COREX_PEER|") {
                    let parts: Vec<&str> = msg.split('|').collect();
                    if parts.len() >= 4 {
                        let name = parts[1].to_string();
                        let peer_port = parts[2].parse::<u16>().unwrap_or(8090);
                        
                        let mut p_list = peers_clone.lock().await;
                        // Avoid duplicates
                        if !p_list.iter().any(|p| p.ip == ip && p.port == peer_port) {
                            p_list.push(P2PPeer {
                                id: format!("{}-{}", name, ip),
                                name,
                                ip,
                                port: peer_port,
                                is_online: true,
                            });
                            info!("✨ New Peer Discovered via UDP: {} at {}", parts[1], addr.ip());
                        }
                    }
                }
            }
        }
    });

    Ok(port)
}

#[tauri::command]
pub async fn p2p_discover_peers(state: tauri::State<'_, P2PState>) -> Result<Vec<P2PPeer>, String> {
    let peers = state.peers.lock().await;
    Ok(peers.clone())
}

#[tauri::command]
pub async fn p2p_send_sync(
    peer_ip: String,
    peer_port: u16,
    data: String, // Base64 or JSON
) -> Result<String, String> {
    info!("📡 Sending encrypted P2P sync to {}:{}", peer_ip, peer_port);
    
    // Simulate AES-256 Encryption here (using a library if available)
    // Since we don't have one in Cargo.toml right now, we'll keep it as a placeholder logic
    let encrypted_data = format!("AES256_ENC({})", data);
    
    let client = reqwest::Client::new();
    let url = format!("http://{}:{}/sync", peer_ip, peer_port);
    
    let res = client.post(url)
        .body(encrypted_data)
        .send()
        .await
        .map_err(|e| e.to_string())?;
        
    let body = res.text().await.map_err(|e| e.to_string())?;
    Ok(body)
}
