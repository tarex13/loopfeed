import { useState } from 'react'
import StepSetup from './StepSetup'
import StepCards from './StepCards'
import StepStyle from './StepStyle'
import StepPreview from './StepPreview'
import StepPublish from './StepPublish'
import { supabase } from '../../lib/supabase'

const stepTitles = ['Setup', 'Cards', 'Style', 'Preview', 'Publish']

export default function CreateLoopPage() {
  const [step, setStep] = useState(0)
  const steps = [<StepSetup />, <StepCards />, <StepStyle />, <StepPreview />, <StepPublish setStep={setStep} />]
  async function josh(){
  //const { data: session } = await supabase.auth.getSession();
  //console.log('Session:', session);
  }
  josh();
  return (
    <div className="inset-0 justify-center items-center flex min-h-screen">
      <div className="p-4 max-w-2xl mx-auto dark:text-white mb-[10vh] flex flex-col justify-center mb-[10vh] overflow-none overflow-auto w-[100%]">
        
        <div className="flex justify-between items-center mb-6">
          {stepTitles.map((label, i) => (
            <div
              key={label}
              onClick={()=>setStep(i)}
              className={`flex-1 cursor-pointer text-center text-xs sm:text-sm py-2 border-b-2 ${
                i === step
                  ? 'border-blue-500 font-semibold'
                  : 'border-gray-300 text-gray-400'
              }`}
            >
              {label}
            </div>
          ))}
        </div>
        <div>
          <div className="border-b-6 border-gray-700 p-6 rounded shadow">{steps[step]}</div>
        
          <div className="mt-6 flex justify-between">
            {step > 0 ? (
              <button onClick={() => setStep(step - 1)} className="text-blue-600 hover:underline">
                ← Back
              </button>
            ) : <div />}

            {step < steps.length - 1 && (
              <button
                onClick={() => setStep(step + 1)}
                className="bg-black text-white px-5 py-2 rounded hover:bg-gray-800 transition"
              >
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
