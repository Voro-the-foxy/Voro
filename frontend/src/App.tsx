function App() {
  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex flex-col w-full h-full gap-10 items-center">
        <div className="w-full h-1/3 bg-black"><img className="w-full h-full p-10 bg-black"src="" alt="" /></div>
        <div className="w-full flex justify-center items-center"><p className="">Glad to ~ meet you!</p></div>
        <button className="border border-black rounded-xl p-2 text-xl">Step1 : set-up your class schedule</button>
        <button className="border border-black rounded-xl p-2 text-xl">Step2 : Step2 : set-up your alarm</button>
        <button className="border border-black rounded-xl p-2 text-xl">Step3 : set your exam day</button>
      </div>
    </div>
  );
}

export default App;
