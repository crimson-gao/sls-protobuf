import { useEffect, useState } from 'react'
import './App.css'
import Editor from '@monaco-editor/react';
import { load } from 'protobufjs';
import useLocalStorage from 'use-local-storage';
import yaml from 'js-yaml'
const proto_file = '/logs.proto'

function uint8ArrayToHex(uint8Array: Uint8Array) {
  return Array.from(uint8Array)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join(' ');
}

const defaultMessage = `Logs:
  - Time: 1734209868
    Contents:
      - Key: hello
        Value: world
Topic: gg
Source: asd
LogTags:
  - Key: tag1
    Value: value3
`
const parser = {
  'type': 'yaml',
  'parse': yaml.load
}

function App() {
  const [hexOutput, setHexOutput] = useState('')
  const [logGroupProto, setLogGroupProto] = useState<any>(undefined)
  const [leftInput, setLeftInput] = useLocalStorage('proto-json-input', '');

  function onLeftInputChange(value: string | undefined) {
    setLeftInput(value)
  }

  useEffect(() => {
    if (logGroupProto)
      return
    load(proto_file, (err, root) => {
      if (err)
        throw err;
      // const LogProto = root!.lookup('sls.Log');
      // const LogContentProto = root!.lookup('sls.Log.Content')
      // const LogTagProto = root!.lookupType('sls.LogTag');
      const LogGroupProto = root!.lookupType('sls.LogGroup');
      setLogGroupProto(LogGroupProto)
    })
  });

  function convertToHex() {
    if (!leftInput) {
      setHexOutput('')
      return
    }
    try {
      const v = parser.parse(leftInput)
      var errMsg = logGroupProto!.verify(v);
      if (errMsg)
        throw new Error(errMsg)
      var message = logGroupProto!.create(v);
      var buffer = logGroupProto!.encode(message).finish();
      setHexOutput(uint8ArrayToHex(buffer))
    }
    catch (e) {
      console.error(e)
      setHexOutput(JSON.stringify(errMsg))
    }
  }

  function reset() {
    setLeftInput(defaultMessage)
  }

  return (
    <>
      <div className="flex flex-row justify-around items-center">
        <div className='px-5'>
          <Editor
            height="70vh"
            width="40vw"
            defaultLanguage={parser.type}
            value={leftInput}
            onChange={onLeftInputChange}
            theme='vs-dark'
            options={{
              fontSize: 16,
            }}
          />
        </div>
        <div className='flex flex-col'>
          <button className='my-10' onClick={reset}>reset</button>
          <button className='my-10 border-spacing-1 border-green-400' onClick={convertToHex}>convert</button>
        </div>
        <div className='px-5'>
          <Editor
            height="70vh"
            width="40vw"
            defaultLanguage="plaintext"
            defaultValue=""
            theme='vs-dark'
            value={hexOutput}
            options={{
              readOnly: true,
              lineNumbers: 'on',
              wordWrap: 'on',
              fontSize: 16,
            }}
          />
        </div>
      </div>
    </>
  )
}

export default App
