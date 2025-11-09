
import React, { useState, useCallback } from 'react';
import type { LoadingState, Font, ColorPalette, AspectRatio, QuotePosition } from './types';
import { fileToBase64 } from './utils/fileUtils';
import { geminiService } from './services/geminiService';
import { UploadIcon, SparklesIcon, HashtagIcon, QuoteIcon, DownloadIcon, CopyIcon, InstagramIcon, PencilIcon } from './components/icons';

const FONT_OPTIONS: Font[] = [
  { name: 'Montserrat', family: 'Montserrat', className: 'font-montserrat' },
  { name: 'Playfair', family: 'Playfair Display', className: 'font-playfair-display' },
  { name: 'Oswald', family: 'Oswald', className: 'font-oswald' },
  { name: 'Lato', family: 'Lato', className: 'font-lato' },
  { name: 'Raleway', family: 'Raleway', className: 'font-raleway' },
  { name: 'Merriweather', family: 'Merriweather', className: 'font-merriweather' },
  { name: 'Pacifico', family: 'Pacifico', className: 'font-pacifico' },
  { name: 'Caveat', family: 'Caveat', className: 'font-caveat' },
  { name: 'Lobster', family: 'Lobster', className: 'font-lobster' },
  { name: 'Roboto', family: 'Roboto', className: 'font-roboto' },
];

const COLOR_PALETTE_OPTIONS: ColorPalette[] = [
  { name: 'Alpine Snow', textColor: '#FFFFFF', bgColor: 'bg-white', textShadow: 'a subtle black shadow' },
  { name: 'Golden Hour', textColor: '#FFD700', bgColor: 'bg-yellow-400', textShadow: 'a soft dark brown shadow' },
  { name: 'Sunset Glow', textColor: '#FF8C00', bgColor: 'bg-orange-500', textShadow: 'a deep purple shadow' },
  { name: 'Forest Canopy', textColor: '#228B22', bgColor: 'bg-green-700', textShadow: 'a light mossy green glow' },
  { name: 'Ocean Deep', textColor: '#00008B', bgColor: 'bg-blue-800', textShadow: 'a bright white outline' },
  { name: 'Earthy Clay', textColor: '#A0522D', bgColor: 'bg-yellow-800', textShadow: 'a soft cream outline' },
  { name: 'Misty Morning', textColor: '#B0C4DE', bgColor: 'bg-slate-400', textShadow: 'a dark grey shadow' },
  { name: 'Wildflower', textColor: '#DA70D6', bgColor: 'bg-orchid-500', textShadow: 'a crisp white shadow' },
  { name: 'Classic Black', textColor: '#000000', bgColor: 'bg-black', textShadow: 'a subtle white shadow' },
  { name: 'Vibrant Aqua', textColor: '#00FFFF', bgColor: 'bg-cyan-400', textShadow: 'a deep blue shadow' },
];

const ASPECT_RATIO_OPTIONS: { name: string, value: AspectRatio }[] = [
    { name: 'Square (1:1)', value: '1:1' },
    { name: 'Portrait (3:4)', value: '3:4' },
    { name: 'Story (9:16)', value: '9:16' },
    { name: 'Landscape (16:9)', value: '16:9' },
];

const QUOTE_POSITION_OPTIONS: { name: string, value: QuotePosition }[] = [
    { name: 'Top', value: 'top' },
    { name: 'Center', value: 'center' },
    { name: 'Bottom', value: 'bottom' },
];

const App: React.FC = () => {
  const [mode, setMode] = useState<'upload' | 'generate' | null>(null);
  const [originalImage, setOriginalImage] = useState<{ file: File | null; base64: string | null }>({ file: null, base64: null });
  const [displayImageBase64, setDisplayImageBase64] = useState<string | null>(null);
  const [editedImageBase64, setEditedImageBase64] = useState<string | null>(null);
  
  const [imageGenPrompt, setImageGenPrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [quote, setQuote] = useState<string>('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [loading, setLoading] = useState<LoadingState>({
    image: false,
    quote: false,
    hashtags: false,
    generateImage: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [selectedFont, setSelectedFont] = useState<Font>(FONT_OPTIONS[0]);
  const [selectedColorPalette, setSelectedColorPalette] = useState<ColorPalette>(COLOR_PALETTE_OPTIONS[0]);
  const [quotePosition, setQuotePosition] = useState<QuotePosition>('center');
  const [watermarkText, setWatermarkText] = useState<string>('');

  const resetState = () => {
    setOriginalImage({ file: null, base64: null });
    setDisplayImageBase64(null);
    setEditedImageBase64(null);
    setQuote('');
    setHashtags([]);
    setUserPrompt('');
    setWatermarkText('');
    setError(null);
  };

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      resetState();
      try {
        const base64 = await fileToBase64(file);
        setOriginalImage({ file, base64 });
        setDisplayImageBase64(base64);
      } catch (e) {
        setError('Failed to load image. Please try another file.');
        console.error(e);
      }
    }
  }, []);
  
  const handleGenerateImage = useCallback(async () => {
    if (!imageGenPrompt) {
        setError("Please enter a prompt to generate an image.");
        return;
    }
    setLoading(prev => ({ ...prev, generateImage: true }));
    resetState();
    try {
        const generatedImage = await geminiService.generateImage(imageGenPrompt, aspectRatio);
        setOriginalImage({ file: null, base64: generatedImage });
        setDisplayImageBase64(generatedImage);
    } catch (e) {
        setError('Failed to generate the image. Please try a different prompt.');
    } finally {
        setLoading(prev => ({ ...prev, generateImage: false }));
    }
  }, [imageGenPrompt, aspectRatio]);

  const handleGenerateQuote = useCallback(async () => {
    setLoading(prev => ({ ...prev, quote: true }));
    setError(null);
    try {
      const newQuote = await geminiService.generateQuote();
      setQuote(newQuote);
    } catch (e) {
      setError('Could not generate a quote. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, quote: false }));
    }
  }, []);

  const handleGenerateHashtags = useCallback(async () => {
    if (!quote && !editedImageBase64) {
        setError("Please generate an image and a quote first to create relevant hashtags.");
        return;
    }
    setLoading(prev => ({ ...prev, hashtags: true }));
    setError(null);
    try {
      const context = quote || "a stunning travel photo featuring nature and friends";
      const newHashtags = await geminiService.generateHashtags(context);
      setHashtags(newHashtags);
    } catch (e) {
      setError('Could not generate hashtags. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, hashtags: false }));
    }
  }, [quote, editedImageBase64]);

  const handleImageEdit = useCallback(async () => {
    if (!displayImageBase64) {
      setError('Please upload or generate an image first.');
      return;
    }
    setLoading(prev => ({ ...prev, image: true }));
    setError(null);
    setEditedImageBase64(null);
    setHashtags([]);

    let finalPrompt = userPrompt;
    if (!finalPrompt && !quote && !watermarkText) {
        finalPrompt = "Subtly enhance the colors and lighting to make the image more vibrant and appealing for social media.";
    }

    if (quote) {
      finalPrompt += `\n\n--- TEXT OVERLAY INSTRUCTIONS ---\n`;
      finalPrompt += `Please add the following text to the image, following these rules precisely:\n`;
      finalPrompt += `1. EXACT TEXT: "${quote}"\n`;
      finalPrompt += `2. FONT: Use a font that strongly resembles '${selectedFont.family}'.\n`;
      finalPrompt += `3. COLOR & STYLE: The text color must be ${selectedColorPalette.textColor}. Apply ${selectedColorPalette.textShadow || 'a subtle shadow for readability'}.\n`;
      finalPrompt += `4. PLACEMENT: Position the text block in the ${quotePosition} area of the image. It must be aesthetically pleasing and not cover any key subjects.\n`;
    }

    if (watermarkText) {
      finalPrompt += `\n--- WATERMARK INSTRUCTIONS ---\n`;
      finalPrompt += `Add a discreet watermark with the text "${watermarkText}" in the bottom-right corner. It should be small and semi-transparent.\n`;
    }
    
    const mimeType = originalImage.file?.type || 'image/jpeg';

    try {
      const editedImage = await geminiService.editImage(
        displayImageBase64,
        mimeType,
        finalPrompt
      );
      setEditedImageBase64(editedImage);
    } catch (e) {
      setError('Failed to edit the image. The model may be unable to process this request. Please try a different prompt or image.');
    } finally {
      setLoading(prev => ({ ...prev, image: false }));
    }
  }, [displayImageBase64, originalImage.file, userPrompt, quote, selectedFont, selectedColorPalette, watermarkText, quotePosition]);
  
  const handleDownload = useCallback(() => {
    if (!editedImageBase64) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${editedImageBase64}`;
    link.download = 'ai-generated-post.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [editedImageBase64]);

  const handleEditAgain = useCallback(() => {
    if (!editedImageBase64) return;
    setDisplayImageBase64(editedImageBase64);
    setEditedImageBase64(null);
    setUserPrompt('');
    setHashtags([]);
  }, [editedImageBase64]);


  const presetPrompts = [
    { name: 'Retro Filter', prompt: 'Apply a warm, grainy retro filter to the image, reminiscent of a vintage photograph.' },
    { name: 'Nature Enhance', prompt: 'Enhance the natural elements. Make the greens more lush, the sky more blue, and add a soft, sunny glow.' },
    { name: 'Dramatic B&W', prompt: 'Convert the image to a high-contrast, dramatic black and white.' },
    { name: 'Remove Background', prompt: 'Remove the background, leaving only the main subject with a clean, transparent background.' },
  ];

  return (
    <div className="bg-gray-900 min-h-screen text-gray-200 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
            AI Instagram Post Generator
          </h1>
          <p className="mt-2 text-gray-400">Create stunning, share-worthy posts in minutes.</p>
        </header>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative mb-6 max-w-3xl mx-auto" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {!mode && <ModeSelector onSelectMode={setMode} />}
        
        {mode === 'upload' && !originalImage.base64 && (
          <ImageUploader onImageUpload={handleImageUpload} />
        )}
        
        {mode === 'generate' && !originalImage.base64 && (
            <ImageGenerator 
                prompt={imageGenPrompt}
                setPrompt={setImageGenPrompt}
                aspectRatio={aspectRatio}
                setAspectRatio={setAspectRatio}
                onGenerate={handleGenerateImage}
                loading={loading.generateImage}
            />
        )}

        {displayImageBase64 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ControlPanel
              userPrompt={userPrompt}
              setUserPrompt={setUserPrompt}
              presetPrompts={presetPrompts}
              loading={loading}
              handleGenerateQuote={handleGenerateQuote}
              handleImageEdit={handleImageEdit}
              quote={quote}
              setQuote={setQuote}
              selectedFont={selectedFont}
              setSelectedFont={setSelectedFont}
              selectedColorPalette={selectedColorPalette}
              setSelectedColorPalette={setSelectedColorPalette}
              quotePosition={quotePosition}
              setQuotePosition={setQuotePosition}
              watermarkText={watermarkText}
              setWatermarkText={setWatermarkText}
            />
            <ResultsDisplay
              sourceImageBase64={displayImageBase64}
              editedImageBase64={editedImageBase64}
              quote={quote}
              hashtags={hashtags}
              loading={loading}
              handleGenerateHashtags={handleGenerateHashtags}
              onDownload={handleDownload}
              onEditAgain={handleEditAgain}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const ModeSelector = ({ onSelectMode }: { onSelectMode: (mode: 'generate' | 'upload') => void }) => (
    <div className="max-w-2xl mx-auto mt-12 p-8 bg-gray-800/50 border border-gray-700 rounded-lg text-center">
        <h2 className="text-2xl font-semibold text-gray-200 mb-6">How would you like to start?</h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
                onClick={() => onSelectMode('generate')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-md font-bold text-lg hover:from-purple-600 hover:to-indigo-600 transition"
            >
                <SparklesIcon className="w-6 h-6" />
                Generate Image with AI
            </button>
            <button
                onClick={() => onSelectMode('upload')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-md font-bold text-lg transition"
            >
                <UploadIcon className="w-6 h-6" />
                Edit My Own Image
            </button>
        </div>
    </div>
);

const ImageGenerator: React.FC<{
    prompt: string, setPrompt: (p: string) => void,
    aspectRatio: AspectRatio, setAspectRatio: (ar: AspectRatio) => void,
    onGenerate: () => void, loading: boolean
}> = ({ prompt, setPrompt, aspectRatio, setAspectRatio, onGenerate, loading }) => (
    <div className="max-w-2xl mx-auto mt-12 p-8 bg-gray-800/50 border border-gray-700 rounded-lg space-y-6">
        <div>
            <label htmlFor="gen-prompt" className="block text-lg font-medium text-gray-300 mb-2">Describe the image you want to create</label>
            <textarea
                id="gen-prompt"
                rows={4}
                className="w-full bg-gray-900 border border-gray-600 rounded-md p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                placeholder="e.g., 'A mystical forest with glowing mushrooms and a serene lake under a starry sky'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
            />
        </div>
         <div>
            <label className="block text-lg font-medium text-gray-300 mb-2">Aspect Ratio for Instagram</label>
            <div className="flex flex-wrap gap-2">
                {ASPECT_RATIO_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => setAspectRatio(opt.value)} className={`px-4 py-2 text-sm rounded-md transition-colors ${aspectRatio === opt.value ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                        {opt.name}
                    </button>
                ))}
            </div>
        </div>
        <button
            onClick={onGenerate}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-md font-bold text-lg hover:from-purple-600 hover:to-indigo-600 transition disabled:opacity-50 disabled:cursor-wait"
        >
            {loading ? 'Generating...' : <><SparklesIcon className="w-6 h-6" /> Generate Image</>}
        </button>
    </div>
);

const ImageUploader = ({ onImageUpload }: { onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
  <div className="max-w-2xl mx-auto mt-12">
    <label htmlFor="file-upload" className="relative block w-full p-8 text-center border-2 border-dashed border-gray-600 rounded-lg hover:border-cyan-400 transition-colors duration-300 cursor-pointer bg-gray-800/50">
      <UploadIcon className="w-12 h-12 mx-auto text-gray-500" />
      <span className="mt-4 block text-lg font-semibold text-gray-300">Upload an image to get started</span>
      <span className="mt-1 block text-sm text-gray-500">PNG, JPG, GIF up to 10MB</span>
      <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={onImageUpload} />
    </label>
  </div>
);

interface ControlPanelProps {
  userPrompt: string; setUserPrompt: (prompt: string) => void;
  presetPrompts: { name: string; prompt: string }[];
  loading: LoadingState;
  handleGenerateQuote: () => void; handleImageEdit: () => void;
  quote: string; setQuote: (q: string) => void;
  selectedFont: Font; setSelectedFont: (font: Font) => void;
  selectedColorPalette: ColorPalette; setSelectedColorPalette: (palette: ColorPalette) => void;
  quotePosition: QuotePosition; setQuotePosition: (p: QuotePosition) => void;
  watermarkText: string; setWatermarkText: (text: string) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ userPrompt, setUserPrompt, presetPrompts, loading, handleGenerateQuote, handleImageEdit, quote, setQuote, selectedFont, setSelectedFont, selectedColorPalette, setSelectedColorPalette, quotePosition, setQuotePosition, watermarkText, setWatermarkText }) => (
    <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 flex flex-col gap-6">
        <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">1. Describe your edits (Optional)</label>
            <textarea id="prompt" rows={3} className="w-full bg-gray-900 border border-gray-600 rounded-md p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition" placeholder="e.g., 'Add a retro filter' or 'Make the background blurry'" value={userPrompt} onChange={(e) => setUserPrompt(e.target.value)} />
        </div>
        <div>
            <p className="text-sm font-medium text-gray-300 mb-2">Or try a preset theme</p>
            <div className="flex flex-wrap gap-2">{presetPrompts.map(p => (<button key={p.name} onClick={() => setUserPrompt(p.prompt)} className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-cyan-800 rounded-full transition-colors">{p.name}</button>))}</div>
        </div>
        <div className="border border-gray-700 rounded-lg p-4 space-y-4">
            <h3 className="text-base font-semibold text-gray-200">2. Add & Style Quote (Optional)</h3>
            <button onClick={handleGenerateQuote} disabled={loading.quote} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed">
                {loading.quote ? 'Generating...' : <><QuoteIcon className="w-5 h-5" /> Generate Motivational Quote</>}
            </button>
            {quote && (
              <div className="space-y-4 pt-2">
                  <textarea rows={3} className="w-full bg-gray-900 border border-gray-600 rounded-md p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition" value={quote} onChange={(e) => setQuote(e.target.value)} />
                 <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Position</label>
                  <div className="flex flex-wrap gap-2">
                    {QUOTE_POSITION_OPTIONS.map(opt => (
                      <button key={opt.value} onClick={() => setQuotePosition(opt.value)} className={`px-4 py-1.5 text-sm rounded-full transition-colors ${quotePosition === opt.value ? 'bg-cyan-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                        {opt.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Font</label>
                  <div className="flex flex-wrap gap-2">{FONT_OPTIONS.map(font => (<button key={font.name} onClick={() => setSelectedFont(font)} className={`px-3 py-1.5 text-sm rounded-full transition-colors ${font.className} ${selectedFont.name === font.name ? 'bg-cyan-500 text-white ring-2 ring-offset-2 ring-offset-gray-800 ring-cyan-400' : 'bg-gray-700 hover:bg-gray-600'}`}>{font.name}</button>))}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Color</label>
                  <div className="flex flex-wrap gap-3">{COLOR_PALETTE_OPTIONS.map(palette => (<button key={palette.name} onClick={() => setSelectedColorPalette(palette)} title={palette.name} className={`w-8 h-8 rounded-full transition ${palette.bgColor} ${selectedColorPalette.name === palette.name ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-cyan-400' : 'hover:opacity-80'}`} />))}</div>
                </div>
              </div>
            )}
        </div>
        <div>
            <label htmlFor="watermark" className="block text-sm font-medium text-gray-300 mb-2">3. Add Watermark (Optional)</label>
            <input id="watermark" type="text" className="w-full bg-gray-900 border border-gray-600 rounded-md p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition" placeholder="e.g., @yourhandle or yoursite.com" value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)} />
        </div>
        <div>
            <h3 className="text-lg font-semibold text-gray-200">4. Create Your Post</h3>
            <button onClick={handleImageEdit} disabled={loading.image} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-md font-bold text-lg hover:from-cyan-600 hover:to-blue-600 transition disabled:opacity-50 disabled:cursor-wait">
                {loading.image ? 'Generating Image...' : <><SparklesIcon className="w-6 h-6" /> Generate Post</>}
            </button>
        </div>
    </div>
);


interface ResultsDisplayProps {
  sourceImageBase64: string | null;
  editedImageBase64: string | null;
  quote: string;
  hashtags: string[];
  loading: LoadingState;
  handleGenerateHashtags: () => void;
  onDownload: () => void;
  onEditAgain: () => void;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ sourceImageBase64, editedImageBase64, quote, hashtags, loading, handleGenerateHashtags, onDownload, onEditAgain }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopyHashtags = useCallback(() => {
        if (hashtags.length === 0) return;
        const hashtagString = hashtags.map(tag => `#${tag}`).join(' ');
        navigator.clipboard.writeText(hashtagString);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
    }, [hashtags]);

    return (
        <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ImageDisplay title="Source Image" src={`data:image/png;base64,${sourceImageBase64}`} isLoading={false} />
                <ImageDisplay title="Generated Result" src={`data:image/png;base64,${editedImageBase64}`} isLoading={loading.image} />
            </div>
            {quote && !editedImageBase64 && (
                <div className="bg-gray-900 p-4 rounded-md border border-gray-700">
                    <p className="text-center font-serif italic text-lg text-gray-300">"{quote}"</p>
                </div>
            )}
            {editedImageBase64 && (
                <div className="flex flex-col sm:flex-row gap-4">
                    <button onClick={onEditAgain} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold transition">
                        <PencilIcon className="w-5 h-5" /> Edit Result
                    </button>
                    <button onClick={handleGenerateHashtags} disabled={loading.hashtags} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed">
                        {loading.hashtags ? 'Generating...' : <><HashtagIcon className="w-5 h-5" /> Generate Hashtags</>}
                    </button>
                    <button onClick={onDownload} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-md font-semibold transition">
                        <DownloadIcon className="w-5 h-5" /> Download Post
                    </button>
                </div>
            )}
            {loading.hashtags && <p className="text-center text-gray-400">Finding trending hashtags...</p>}
            {hashtags.length > 0 && (
                <>
                    <div className="bg-gray-900 p-4 rounded-md border border-gray-700">
                        <p className="text-sm font-medium text-gray-300 mb-3">Trending Hashtags:</p>
                        <div className="flex flex-wrap gap-2">
                            {hashtags.map((tag, index) => (
                                <span key={index} className="px-2.5 py-1 text-sm bg-cyan-900/50 text-cyan-200 rounded-full">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </div>
                     <div className="border-t border-gray-700 pt-4 space-y-4">
                        <h3 className="text-lg font-semibold text-center text-gray-300">Ready to Post?</h3>
                        <p className="text-sm text-center text-gray-400">
                            Download your image and copy the hashtags, then head to Instagram or your favorite scheduling tool.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                             <button 
                                 onClick={handleCopyHashtags} 
                                 className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md font-semibold transition"
                             >
                                <CopyIcon className="w-5 h-5" />
                                {isCopied ? 'Copied!' : 'Copy Hashtags'}
                             </button>
                             <a 
                                 href="https://www.instagram.com" 
                                 target="_blank" 
                                 rel="noopener noreferrer"
                                 className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white rounded-md font-semibold transition hover:opacity-90"
                             >
                                <InstagramIcon className="w-5 h-5" />
                                Post on Instagram
                             </a>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};


const ImageDisplay = ({ title, src, isLoading }: { title: string, src: string | null, isLoading: boolean }) => (
    <div>
        <h3 className="text-center font-semibold mb-2 text-gray-400">{title}</h3>
        <div className="aspect-square w-full bg-gray-900 rounded-md border border-gray-700 flex items-center justify-center relative overflow-hidden">
            {isLoading ? (
                <div className="flex flex-col items-center gap-2 text-gray-500">
                    <SparklesIcon className="w-8 h-8 animate-pulse" />
                    <span>Generating...</span>
                </div>
            ) : src && src !== 'data:image/png;base64,null' ? (
                <img src={src} alt={title} className="object-cover w-full h-full" />
            ) : (
                <div className="text-gray-600">Your image will appear here</div>
            )}
        </div>
    </div>
);


export default App;
