import React, { useState, useEffect } from 'react';
import { Upload, Play, Pause, SkipForward, SkipBack, Volume2, BookOpen, Plus, RotateCw, ChevronDown, ChevronUp, Trash2, FolderOpen } from 'lucide-react';
import * as XLSX from 'xlsx';

// Component: File Upload
const FileUploader = ({ onFilesUploaded, onAddVocabSet }) => {
  const [excelFile, setExcelFile] = useState(null);
  const [audioFiles, setAudioFiles] = useState([]);
  const [setName, setSetName] = useState('');

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setExcelFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        
        const vocabList = jsonData.slice(1).map((row, index) => ({
          stt: row[0] || index + 1,
          word: row[1] || '',
          type: row[2] || '',
          phonetic: row[3] || '',
          meaning: row[4] || '',
          audioName: `tu_${String(index + 1).padStart(3, '0')}.wav`
        }));
        
        onFilesUploaded({ vocabList, audioFiles });
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleAudioUpload = (e) => {
    const files = Array.from(e.target.files);
    const audioMap = {};
    
    files.forEach(file => {
      audioMap[file.name] = URL.createObjectURL(file);
    });
    
    setAudioFiles(audioMap);
    onFilesUploaded({ audioFiles: audioMap });
  };

  const handleSaveSet = () => {
    if (!setName.trim()) {
      alert('Vui lòng nhập tên bộ từ!');
      return;
    }
    onAddVocabSet(setName);
    setSetName('');
    setExcelFile(null);
    setAudioFiles([]);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Plus size={24} />
        Tải lên bộ từ mới
      </h2>
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block mb-2 font-semibold text-gray-700">
            File Excel (.xlsx, .xls)
          </label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleExcelUpload}
            className="w-full p-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500"
          />
          {excelFile && (
            <p className="mt-2 text-sm text-green-600">✓ {excelFile.name}</p>
          )}
        </div>
        <div>
          <label className="block mb-2 font-semibold text-gray-700">
            File Audio (.wav) - Chọn nhiều file
          </label>
          <input
            type="file"
            accept=".wav,.mp3"
            multiple
            onChange={handleAudioUpload}
            className="w-full p-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500"
          />
          {audioFiles && Object.keys(audioFiles).length > 0 && (
            <p className="mt-2 text-sm text-green-600">
              ✓ {Object.keys(audioFiles).length} file audio
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Đặt tên bộ từ (VD: IELTS Unit 1, TOEIC Lesson 2...)"
          value={setName}
          onChange={(e) => setSetName(e.target.value)}
          className="flex-1 p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none"
        />
        <button
          onClick={handleSaveSet}
          disabled={!excelFile || Object.keys(audioFiles).length === 0}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          Lưu bộ từ
        </button>
      </div>
    </div>
  );
};

// Component: Saved Sets Manager
const SavedSetsManager = ({ vocabSets, onSelectSet, onDeleteSet, currentSetId }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FolderOpen size={24} className="text-blue-600" />
          <h2 className="text-xl font-bold">
            Các bộ từ đã lưu ({vocabSets.length})
          </h2>
        </div>
        {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
      </button>
      
      {isExpanded && (
        <div className="p-4 border-t">
          {vocabSets.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Chưa có bộ từ nào được lưu</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {vocabSets.map((set) => (
                <div
                  key={set.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    currentSetId === set.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1" onClick={() => onSelectSet(set.id)}>
                      <h3 className="font-bold text-lg mb-1">{set.name}</h3>
                      <p className="text-sm text-gray-600">
                        {set.vocabList.length} từ vựng
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(set.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Xóa bộ từ "${set.name}"?`)) {
                          onDeleteSet(set.id);
                        }
                      }}
                      className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Component: Flashcard
const Flashcard = ({ vocab, audioUrl, onNext, onPrev, currentIndex, total }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef(null);

  const playAudio = () => {
    if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => setIsPlaying(false);
    }
  }, [audioUrl]);

  React.useEffect(() => {
    setIsFlipped(false);
    setIsPlaying(false);
  }, [currentIndex]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    onNext();
  };

  const handlePrev = () => {
    onPrev();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-600 font-semibold">
          Thẻ {currentIndex + 1} / {total}
        </span>
        <div className="flex-1 mx-4 bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
          ></div>
        </div>
        <span className="text-sm text-gray-600 font-semibold">
          {Math.round(((currentIndex + 1) / total) * 100)}%
        </span>
      </div>

      {/* Flashcard */}
      <div 
        className="relative h-96 cursor-pointer"
        style={{ perspective: '1000px' }}
        onClick={handleFlip}
      >
        <div 
          className={`absolute w-full h-full transition-transform duration-500 transform-style-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          style={{ 
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
        >
          {/* Front Side */}
          <div 
            className="absolute w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-2xl p-8 flex flex-col items-center justify-center text-white"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="absolute top-4 right-4">
              <span className="bg-white text-blue-600 px-3 py-1 rounded-full text-sm font-semibold">
                {vocab.type}
              </span>
            </div>

            <h1 className="text-6xl font-bold mb-6">{vocab.word}</h1>
            <p className="text-3xl mb-8 opacity-90">{vocab.phonetic}</p>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                playAudio();
              }}
              className="bg-white text-blue-600 rounded-full p-4 hover:scale-110 transition-transform shadow-lg mb-6"
              disabled={!audioUrl}
            >
              {isPlaying ? <Pause size={32} /> : <Play size={32} />}
            </button>

            <div className="absolute bottom-8 flex items-center gap-2 text-sm opacity-75">
              <RotateCw size={16} />
              <span>Click để xem nghĩa</span>
            </div>

            {audioUrl && <audio ref={audioRef} src={audioUrl} />}
          </div>

          {/* Back Side */}
          <div 
            className="absolute w-full h-full bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl shadow-2xl p-8 flex flex-col items-center justify-center text-white"
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            <div className="absolute top-4 right-4">
              <span className="bg-white text-green-600 px-3 py-1 rounded-full text-sm font-semibold">
                Nghĩa
              </span>
            </div>

            <BookOpen size={48} className="mb-6 opacity-80" />
            <p className="text-4xl font-semibold text-center mb-4">{vocab.meaning}</p>
            <p className="text-xl opacity-90 mb-4">{vocab.word}</p>
            <p className="text-lg opacity-75">{vocab.phonetic}</p>

            <div className="absolute bottom-8 flex items-center gap-2 text-sm opacity-75">
              <RotateCw size={16} />
              <span>Click để quay lại</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center items-center gap-4 mt-6">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="bg-white hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-full p-4 shadow-lg transition-all hover:scale-110"
        >
          <SkipBack size={28} className="text-gray-700" />
        </button>

        <button
          onClick={handleFlip}
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-8 py-4 shadow-lg transition-all hover:scale-105 flex items-center gap-2 font-semibold"
        >
          <RotateCw size={20} />
          {isFlipped ? 'Mặt trước' : 'Xem nghĩa'}
        </button>

        <button
          onClick={handleNext}
          disabled={currentIndex === total - 1}
          className="bg-white hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-full p-4 shadow-lg transition-all hover:scale-110"
        >
          <SkipForward size={28} className="text-gray-700" />
        </button>
      </div>

      {/* Keyboard Hint */}
      <div className="text-center mt-4 text-sm text-gray-500">
        <p>Phím tắt: ← Trước | Space Lật thẻ | → Sau</p>
      </div>
    </div>
  );
};

// Component: Vocabulary List (Collapsible)
const VocabList = ({ vocabList, onSelect, selectedIndex }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen size={20} />
          <span className="font-bold">Danh sách từ ({vocabList.length})</span>
        </div>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      
      {isExpanded && (
        <div className="border-t max-h-96 overflow-y-auto">
          {vocabList.map((vocab, index) => (
            <div
              key={index}
              onClick={() => {
                onSelect(index);
                setIsExpanded(false);
              }}
              className={`p-4 border-b cursor-pointer hover:bg-blue-50 transition-colors ${
                selectedIndex === index ? 'bg-blue-100 border-l-4 border-blue-500' : ''
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-bold text-lg">{vocab.word}</span>
                  <span className="text-gray-500 ml-3 text-sm">{vocab.phonetic}</span>
                </div>
                <span className="text-xs text-gray-500">{vocab.type}</span>
              </div>
              <p className="text-gray-600 mt-1 text-sm">{vocab.meaning}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Main App Component
const App = () => {
  const [vocabSets, setVocabSets] = useState([]);
  const [currentSetId, setCurrentSetId] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tempVocabList, setTempVocabList] = useState([]);
  const [tempAudioFiles, setTempAudioFiles] = useState({});

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('vocabSets');
    if (saved) {
      setVocabSets(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (vocabSets.length > 0) {
      localStorage.setItem('vocabSets', JSON.stringify(vocabSets));
    }
  }, [vocabSets]);

  const handleFilesUploaded = ({ vocabList, audioFiles }) => {
    if (vocabList) setTempVocabList(vocabList);
    if (audioFiles) setTempAudioFiles(prev => ({ ...prev, ...audioFiles }));
  };

  const handleAddVocabSet = (setName) => {
    const newSet = {
      id: Date.now(),
      name: setName,
      vocabList: tempVocabList,
      audioFiles: tempAudioFiles,
      createdAt: new Date().toISOString()
    };
    setVocabSets(prev => [...prev, newSet]);
    setCurrentSetId(newSet.id);
    setCurrentIndex(0);
    setTempVocabList([]);
    setTempAudioFiles({});
    alert('Đã lưu bộ từ thành công!');
  };

  const handleSelectSet = (setId) => {
    setCurrentSetId(setId);
    setCurrentIndex(0);
  };

  const handleDeleteSet = (setId) => {
    setVocabSets(prev => prev.filter(set => set.id !== setId));
    if (currentSetId === setId) {
      setCurrentSetId(null);
    }
  };

  const currentSet = vocabSets.find(set => set.id === currentSetId);
  const currentVocab = currentSet?.vocabList[currentIndex];
  const currentAudio = currentVocab ? currentSet.audioFiles[currentVocab.audioName] : null;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!currentSet) return;
      
      if (e.key === 'ArrowLeft') {
        setCurrentIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex(prev => Math.min(prev + 1, currentSet.vocabList.length - 1));
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentSet]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            <Volume2 size={40} className="text-blue-600" />
            Flashcard Học Từ Vựng
          </h1>
          <p className="text-gray-600">Lật thẻ để học từ vựng hiệu quả</p>
        </header>

        <FileUploader 
          onFilesUploaded={handleFilesUploaded} 
          onAddVocabSet={handleAddVocabSet}
        />

        <SavedSetsManager
          vocabSets={vocabSets}
          onSelectSet={handleSelectSet}
          onDeleteSet={handleDeleteSet}
          currentSetId={currentSetId}
        />

        {currentSet && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Flashcard
                vocab={currentVocab}
                audioUrl={currentAudio}
                onNext={() => setCurrentIndex(prev => Math.min(prev + 1, currentSet.vocabList.length - 1))}
                onPrev={() => setCurrentIndex(prev => Math.max(prev - 1, 0))}
                currentIndex={currentIndex}
                total={currentSet.vocabList.length}
              />
            </div>
            <div>
              <VocabList
                vocabList={currentSet.vocabList}
                onSelect={setCurrentIndex}
                selectedIndex={currentIndex}
              />
            </div>
          </div>
        )}

        {!currentSet && vocabSets.length === 0 && (
          <div className="text-center py-20 bg-white rounded-lg shadow-md">
            <Upload size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-xl text-gray-500">
              Chưa có dữ liệu. Hãy tải lên file Excel và audio để bắt đầu!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;