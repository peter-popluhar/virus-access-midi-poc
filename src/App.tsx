import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [midiAccess, setMidiAccess] = useState<MIDIAccess | null>(null);
  const [inputs, setInputs] = useState<MIDIInput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [sysexEnabled, setSysexEnabled] = useState(false);

useEffect(() => {
  const initializeMidi = async () => {
    try {
      const access = await navigator.requestMIDIAccess({sysex: true})
      setMidiAccess(access);
      setSysexEnabled(true);

      const availableInputs = Array.from(access.inputs.values())
      setInputs(availableInputs);

      access.onstatechange = (e) => {
        const updatedInputs = Array.from(access.inputs.values())
        setInputs(updatedInputs);
        if(e?.port?.type === 'input') {
          setMessage(`MIDI input ${e.port.state} : ${e.port.name}`);
        }
      };
    } catch (err: any) {
      setError(`Error accessing MIDI devices: ${err.message || err}`);
      setSysexEnabled(false)
    }

  }

  initializeMidi();

  return(() => {
    if(midiAccess) {
      midiAccess.inputs.forEach(input => {
        input.onmidimessage = null;
      })
      midiAccess.onstatechange = null;
    }
  })
}, [])

useEffect(() => {
  const handleMidiMessage = (event: MIDIMessageEvent) => {
    if (!event.data) return;
    const [command, note, velocity] = event.data;

    console.log('event', event);

    let newMessage = '';
    switch (command) {
      case 178: // Note On
        newMessage = `Note On: ${note}, Velocity: ${velocity}`;
        break;
      case 128: // Note Off
        newMessage = `Note Off: ${note}`;
        break;
      case 176: // Control Change
        newMessage = `Control Change: ${note}, Value: ${velocity}`;
        break;
      default:
        newMessage = `Unhandled MIDI command: ${command}`;
    }

    setMessages(prevMessages => [...prevMessages, newMessage]);
  };

  inputs.forEach(input => {
    input.onmidimessage = handleMidiMessage;
  });

  return () => {
    inputs.forEach(input => {
      input.onmidimessage = null;
    });
  };
}, [inputs])

const noMidi = !navigator.requestMIDIAccess;

console.log(message)


  return (
    <>
      <p>Virus Access TI:</p>

      {noMidi && <p>Your browser does not support the Web MIDI API.</p>}
      {error && <p>{error}</p>}

      <div>
        <p>
          Available MIDI Inputs:
        </p>
        {inputs.length > 0 ? (
          <ul>
            {inputs.map(input => (
              <li key={input.id}>
                {input.name} ({input.manufacturer})
              </li>
            ))}
          </ul>
        ) : (
          <p>No MIDI inputs detected.</p>
        )}
      </div>

      {messages.length > 0 && (
        <div>
          <h2>MIDI Messages:</h2>
          <ul>
            {messages.map((msg, index) => (
              <li key={index}>{msg}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}

export default App
