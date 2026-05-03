import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { X, Crop, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import Button from '../common/Button';

const loadPdfJs = () => new Promise((resolve, reject) => {
  if (window.pdfjsLib) return resolve(window.pdfjsLib);
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  script.onload = () => {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    resolve(window.pdfjsLib);
  };
  script.onerror = reject;
  document.head.appendChild(script);
});

export default function PdfCropper({ file, pageNum, onPageChange, onCancel, onCrop }) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [isRendering, setIsRendering] = useState(false);
  
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const containerRef = useRef(null);
  
  const [startPos, setStartPos] = useState(null);
  const [cropBox, setCropBox] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!file) return;
    let isMounted = true;
    
    const initPdf = async () => {
      try {
        const pdfjs = await loadPdfJs();
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument(arrayBuffer).promise;
        if (isMounted) {
          setPdfDoc(pdf);
          if (pageNum === 1) onPageChange(1); // Ensure it matches
        }
      } catch (err) {
        toast.error('Không thể đọc file PDF.');
        onCancel();
      }
    };
    initPdf();
    return () => { isMounted = false; };
  }, [file, onCancel]);

  useEffect(() => {
    if (!pdfDoc) return;
    
    const renderPage = async () => {
      setIsRendering(true);
      try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 }); // High res for crisp math
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        const overlay = overlayRef.current;
        overlay.width = viewport.width;
        overlay.height = viewport.height;

        await page.render({ canvasContext: ctx, viewport }).promise;
      } catch (err) {
        toast.error('Lỗi khi render trang PDF.');
      } finally {
        setIsRendering(false);
        setCropBox(null);
      }
    };
    
    renderPage();
  }, [pdfDoc, pageNum]);

  // Handle Mouse Events for Drawing Crop Box
  const getMousePos = (e) => {
    const rect = overlayRef.current.getBoundingClientRect();
    const scaleX = overlayRef.current.width / rect.width;
    const scaleY = overlayRef.current.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const onMouseDown = (e) => {
    if (e.button !== 0) return; // Only left click
    const pos = getMousePos(e);
    setStartPos(pos);
    setIsDragging(true);
    setCropBox({ x: pos.x, y: pos.y, width: 0, height: 0 });
  };

  const onMouseMove = (e) => {
    if (!isDragging || !startPos) return;
    const pos = getMousePos(e);
    const x = Math.min(pos.x, startPos.x);
    const y = Math.min(pos.y, startPos.y);
    const width = Math.abs(pos.x - startPos.x);
    const height = Math.abs(pos.y - startPos.y);
    
    setCropBox({ x, y, width, height });
    
    // Draw the box on overlay
    const ctx = overlayRef.current.getContext('2d');
    ctx.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
    
    // Darken outside
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, overlayRef.current.width, overlayRef.current.height);
    
    // Clear inside
    ctx.clearRect(x, y, width, height);
    
    // Draw border
    ctx.strokeStyle = '#2563eb'; // blue-600
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(x, y, width, height);
  };

  const onMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // If box is too small, cancel
    if (cropBox && (cropBox.width < 50 || cropBox.height < 20)) {
      setCropBox(null);
      const ctx = overlayRef.current.getContext('2d');
      ctx.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
    }
  };

  const handleCrop = () => {
    if (!cropBox) return toast.error('Vui lòng kéo chuột quét chọn câu hỏi trước.');
    
    // Extract image data
    const canvas = canvasRef.current;
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = cropBox.width;
    croppedCanvas.height = cropBox.height;
    
    const ctx = croppedCanvas.getContext('2d');
    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, cropBox.width, cropBox.height);
    // Draw cropped area
    ctx.drawImage(
      canvas, 
      cropBox.x, cropBox.y, cropBox.width, cropBox.height, 
      0, 0, cropBox.width, cropBox.height
    );
    
    // Convert to Blob
    croppedCanvas.toBlob((blob) => {
      onCrop(blob);
      // Reset overlay
      setCropBox(null);
      const overlayCtx = overlayRef.current.getContext('2d');
      overlayCtx.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b flex items-center justify-between shrink-0">
        <div>
          <h2 className="font-bold text-gray-900">Cắt ảnh câu hỏi từ PDF</h2>
          <p className="text-xs text-gray-500">Dùng chuột quét chọn vùng chứa câu hỏi (bao gồm đề & đáp án)</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded">
            <button 
              className="p-1 hover:bg-white rounded disabled:opacity-50"
              onClick={() => onPageChange(Math.max(1, pageNum - 1))}
              disabled={pageNum <= 1 || isRendering}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium w-16 text-center">
              {pageNum} / {pdfDoc?.numPages || '?'}
            </span>
            <button 
              className="p-1 hover:bg-white rounded disabled:opacity-50"
              onClick={() => onPageChange(Math.min(pdfDoc.numPages, pageNum + 1))}
              disabled={!pdfDoc || pageNum >= pdfDoc.numPages || isRendering}
            >
              <ChevronRight size={16} />
            </button>
          </div>
          
          <Button variant="primary" icon={Check} onClick={handleCrop} disabled={!cropBox}>
            Sử dụng ảnh này
          </Button>
          
          <button onClick={onCancel} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>
      </div>
      
      {/* Viewer */}
      <div className="flex-1 overflow-auto bg-gray-100 relative p-8 flex justify-center" ref={containerRef}>
        <div className="relative shadow-xl bg-white" style={{ minHeight: '600px' }}>
          <canvas ref={canvasRef} className="block max-w-full h-auto" />
          <canvas 
            ref={overlayRef} 
            className="absolute inset-0 max-w-full h-auto cursor-crosshair"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          />
        </div>
      </div>
    </div>
  );
}
