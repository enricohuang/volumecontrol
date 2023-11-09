import { CallClient } from "@azure/communication-calling";
import { AzureCommunicationTokenCredential } from '@azure/communication-common';

let call;
let incomingCall;
let callAgent;
let deviceManager;
let tokenCredential;
const userToken = document.getElementById("token-input"); 
const calleeInput = document.getElementById("callee-id-input");
const submitToken = document.getElementById("token-submit");
const callButton = document.getElementById("call-button");
const hangUpButton = document.getElementById("hang-up-button");
const acceptCallButton = document.getElementById('accept-call-button');

submitToken.addEventListener("click", async () => {
  const callClient = new CallClient();
  const userTokenCredential = userToken.value;
    try {
      tokenCredential = new AzureCommunicationTokenCredential(userTokenCredential);
      callAgent = await callClient.createCallAgent(tokenCredential);
      deviceManager = await callClient.getDeviceManager();
      await deviceManager.askDevicePermission({ audio: true });
      callButton.disabled = false;
      submitToken.disabled = true;
      // Listen for an incoming call to accept.
      callAgent.on('incomingCall', async (args) => {
        try {
          incomingCall = args.incomingCall;
          acceptCallButton.disabled = false;
          callButton.disabled = true;
        } catch (error) {
          console.error(error);
        }
      });
    } catch(error) {
      window.alert("Please submit a valid token!");
    }
})

  const audioCtx = new AudioContext();
    
  // Create the node that controls the volume.
  const gainNode = new GainNode(audioCtx);

  
  const volumeControl = document.querySelector('[data-action="volume"]');
  volumeControl.addEventListener(
    "input",
    () => {
      console.log("Changing gain", volumeControl.value)
      gainNode.gain.value = volumeControl.value;
    },
    false
  );
  

  // Create the node that controls the panning
  const panner = new StereoPannerNode(audioCtx, { pan: 0 });

  const pannerControl = document.querySelector('[data-action="panner"]');
  pannerControl.addEventListener(
    "input",
    () => {
      console.log("Changing panner", pannerControl.value)
      panner.pan.value = pannerControl.value;
    },
    false
  );
 
  callButton.addEventListener("click", () => {
  // start a call
  const userToCall = calleeInput.value;
  call = callAgent.startCall(
      [{ id: userToCall }],
      {}
  );

  const callStateChangedHandler = async () => {
    if (call.state === "Connected") {
    }
    else if(call.state === "Disconnected") {
        hangUpButton.disabled = true;
        callButton.disabled = false;        
    }
  };
  
  const remoteStateChangedHandler = async (rps) => {
      if (rps.added.length > 0) {
        const remoteAudioStream = rps.added[0]
        
        const ms = await remoteAudioStream.getMediaStream();
        console.log("The remote Audio streams are", ms);
        //const source = audioCtx.createMediaStreamSource(ms);
        const source = new MediaStreamAudioSourceNode(audioCtx, {
            mediaStream: ms,
          });
       // connect the AudioBufferSourceNode to the gainNode
       // and the gainNode to the destination, so we can play the
       // music and adjust the volume using the mouse cursor
       source.connect(gainNode).connect(panner).connect(audioCtx.destination);

    }  
  };

  call.on("stateChanged", callStateChangedHandler);
  call.on('remoteAudioStreamsUpdated', remoteStateChangedHandler);

  // toggle button states
  hangUpButton.disabled = false;
  callButton.disabled = true;
});

hangUpButton.addEventListener("click", () => {
  // end the current call
  call.hangUp({ forEveryone: true });

  // toggle button states
  hangUpButton.disabled = true;
  callButton.disabled = false;
  submitToken.disabled = false;
  acceptCallButton.disabled = true;
});

acceptCallButton.onclick = async () => {
  try {
    call = await incomingCall.accept();
    acceptCallButton.disabled = true;
    hangUpButton.disabled = false;
  } catch (error) {
    console.error(error);
  }
}