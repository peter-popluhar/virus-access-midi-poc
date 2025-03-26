import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [midiAccess, setMidiAccess] = useState<MIDIAccess | null>(null);
  const [inputs, setInputs] = useState<MIDIInput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
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
    const command = event.data[0];
    const note = event.data[1];
    const velocity = event.data[2];

    console.log('event', event)

    if (command === 178) { // Note On
      setMessage(`Attack: ${note}, Velocity: ${velocity}`);
    } else if (command === 128) { // Note Off
      setMessage(`Note Off: ${note}`);
    } else if (command === 176) { // Control Change
      setMessage(`Control Change: ${note}, Value: ${velocity}`);
    }


  }

  inputs.forEach(input => {
    input.onmidimessage = handleMidiMessage;
  })

  return () => {
    inputs.forEach(input => {
      input.onmidimessage = null
    })
  }
},[inputs])

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

      {message && (
        <div>
          <h2>Last MIDI Message:</h2>
          <p>
            {message}
          </p>
        </div>
      )}
    </>
  )
}

export default App
