use gilrs::{Event, EventType, Gilrs};
use std::{net::TcpListener, thread::spawn};
use tungstenite::accept;

fn main() {
    let server = TcpListener::bind("localhost:8080").unwrap();

    for stream in server.incoming() {
        let mut gilrs = Gilrs::new().unwrap();
        spawn(move || {
            let mut websocket = accept(stream.unwrap()).unwrap();
            loop {
                while let Some(Event {
                    id: _,
                    event,
                    time: _,
                }) = gilrs.next_event()
                {
                    match event {
                        EventType::ButtonPressed(button, code) => {
                            let msg = format!("{{\"{:?}\":\"{}\"}}", button, code);
                            println!("{}", msg);
                            websocket.send(tungstenite::Message::Text(msg)).unwrap();
                        }
                        EventType::ButtonRepeated(_, _) => {}
                        EventType::ButtonReleased(_, _) => {}
                        EventType::ButtonChanged(_, _, _) => {}
                        EventType::AxisChanged(axis, f32, _) => {
                            // Format message JSON Style
                            let msg = format!("{{\"{:?}\":\"{}\"}}", axis, f32);
                            println!("{}", msg);
                            websocket.send(tungstenite::Message::Text(msg)).unwrap();
                            // socket.send(Message::Text(msg.into())).unwrap();
                        }
                        EventType::Connected => println!("Controller connected"),
                        EventType::Disconnected => todo!(),
                        EventType::Dropped => todo!(),
                    }
                }
            }
        });
    }
}
