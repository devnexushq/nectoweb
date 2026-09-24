import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getRole, getUserPhone, getUserId, setUserPhone } from "@/lib/role";
import { formatShortRelativeTime } from "@/lib/freshness";
import { Star, MessageSquarePlus, Edit3, ShieldAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export interface ReviewItem {
  id: string;
  worker_id: string | null;
  shop_id: string | null;
  reviewer_phone: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at?: string;
}

interface ReviewsSectionProps {
  targetId: string;
  targetType: "worker" | "shop";
  targetName: string;
  initialRating?: number;
  contactTrigger?: number;
  onRatingUpdated?: (newRating: number) => void;
}

function getCandidatePhones(phone: string | null | undefined): string[] {
  if (!phone) return [];
  const raw = phone.trim();
  const digits = raw.replace(/\D/g, "");
  const list = new Set<string>();
  if (raw) list.add(raw);
  if (digits) list.add(digits);
  if (digits.length === 10) {
    list.add(`+91${digits}`);
    list.add(`91${digits}`);
  }
  if (raw.startsWith("+")) {
    list.add(raw.slice(1));
  } else if (digits.length > 0) {
    list.add(`+${digits}`);
  }
  return Array.from(list).filter(Boolean);
}

function formatReviewerLabel(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 4) {
    return `Verified Customer (•••• ${digits.slice(-4)})`;
  }
  return "Verified Customer";
}

const RATING_LABELS: Record<number, string> = {
  1: "1 - Poor",
  2: "2 - Fair",
  3: "3 - Good",
  4: "4 - Very Good",
  5: "5 - Excellent",
};

export function ReviewsSection({
  targetId,
  targetType,
  targetName,
  initialRating = 0,
  contactTrigger = 0,
  onRatingUpdated,
}: ReviewsSectionProps) {
  const role = getRole();
  const isCustomer = role === "customer";
  const [customerPhone, setCustomerPhone] = useState<string | null>(() => getUserPhone());

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasContacted, setHasContacted] = useState(false);
  const [checkingContact, setCheckingContact] = useState(false);
  const [myExistingReview, setMyExistingReview] = useState<ReviewItem | null>(null);

  // Modal form state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const targetColumn = targetType === "worker" ? "worker_id" : "shop_id";

  // Listen for session backfill updates (e.g. from useCustomerSessionBackfill)
  useEffect(() => {
    const handlePhoneUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setCustomerPhone(customEvent.detail);
      } else {
        setCustomerPhone(getUserPhone());
      }
    };
    window.addEventListener("necto_phone_updated", handlePhoneUpdate);
    const current = getUserPhone();
    if (current && current !== customerPhone) {
      setCustomerPhone(current);
    }
    return () => {
      window.removeEventListener("necto_phone_updated", handlePhoneUpdate);
    };
  }, [customerPhone]);

  // Fetch reviews & my existing review
  const loadReviews = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq(targetColumn, targetId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        // If table doesn't exist yet in remote schema, fail gracefully
        if (error.code === "42P01") {
          setReviews([]);
          return;
        }
        console.warn("Error fetching reviews:", error.message);
        return;
      }

      const list = (data as ReviewItem[]) || [];
      setReviews(list);

      // Calculate live average
      if (list.length > 0) {
        const sum = list.reduce((acc, cur) => acc + cur.rating, 0);
        const liveAvg = Number((sum / list.length).toFixed(1));
        onRatingUpdated?.(liveAvg);
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  }, [targetColumn, targetId, onRatingUpdated]);

  // Check if current customer has contacted this target worker/shop
  const checkCustomerContactAndReview = useCallback(async () => {
    if (!isCustomer) {
      setHasContacted(false);
      return;
    }

    let activePhone = customerPhone || getUserPhone();
    if (!activePhone) {
      const uid = getUserId();
      if (uid) {
        try {
          const { data } = await supabase
            .from("customers")
            .select("phone")
            .eq("id", uid)
            .maybeSingle();
          if (data?.phone) {
            activePhone = data.phone;
            setUserPhone(data.phone);
            setCustomerPhone(data.phone);
          }
        } catch {
          // ignore
        }
      }
    }

    if (!activePhone) {
      setHasContacted(false);
      return;
    }

    setCheckingContact(true);
    const candidatePhones = getCandidatePhones(activePhone);

    try {
      // 1. Check contacts_log
      const { data: contacts, error: contactErr } = await supabase
        .from("contacts_log")
        .select("id")
        .eq("to_id", targetId)
        .in("from_phone", candidatePhones)
        .limit(1);

      if (!contactErr && contacts && contacts.length > 0) {
        setHasContacted(true);
      } else {
        setHasContacted(false);
      }

      // 2. Check if customer already submitted a review
      const { data: userReview } = await supabase
        .from("reviews")
        .select("*")
        .eq(targetColumn, targetId)
        .in("reviewer_phone", candidatePhones)
        .maybeSingle();

      if (userReview) {
        setMyExistingReview(userReview as ReviewItem);
      } else {
        setMyExistingReview(null);
      }
    } catch {
      // Fail closed on contact requirement
      setHasContacted(false);
    } finally {
      setCheckingContact(false);
    }
  }, [isCustomer, customerPhone, targetId, targetColumn]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    checkCustomerContactAndReview();
  }, [checkCustomerContactAndReview, contactTrigger]);

  const openReviewModal = () => {
    if (myExistingReview) {
      setSelectedRating(myExistingReview.rating);
      setComment(myExistingReview.comment || "");
    } else {
      setSelectedRating(5);
      setComment("");
    }
    setErrorMessage(null);
    setDialogOpen(true);
  };

  const handleSubmitReview = async () => {
    const activePhone = customerPhone || getUserPhone();
    if (!isCustomer || !activePhone) {
      toast.error("Only registered customers can leave reviews.");
      return;
    }

    if (!hasContacted) {
      toast.error(`Contact this ${targetType} first to leave a review.`);
      return;
    }

    if (selectedRating < 1 || selectedRating > 5) {
      setErrorMessage("Please select a rating between 1 and 5 stars.");
      return;
    }

    if (comment.length > 300) {
      setErrorMessage("Review comment cannot exceed 300 characters.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const trimmedComment = comment.trim() || null;
      let reviewResultId = myExistingReview?.id;

      if (myExistingReview) {
        // Edit existing review
        const { data, error } = await supabase
          .from("reviews")
          .update({
            rating: selectedRating,
            comment: trimmedComment,
            updated_at: new Date().toISOString(),
          })
          .eq("id", myExistingReview.id)
          .select()
          .single();

        if (error) throw error;
        if (data) setMyExistingReview(data as ReviewItem);
        toast.success("Review updated successfully!");
      } else {
        // Upsert/Insert new review
        const candidatePhones = getCandidatePhones(activePhone);
        const { data: existingCheck } = await supabase
          .from("reviews")
          .select("id")
          .eq(targetColumn, targetId)
          .in("reviewer_phone", candidatePhones)
          .maybeSingle();

        if (existingCheck) {
          const { data, error } = await supabase
            .from("reviews")
            .update({
              rating: selectedRating,
              comment: trimmedComment,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingCheck.id)
            .select()
            .single();

          if (error) throw error;
          if (data) setMyExistingReview(data as ReviewItem);
          toast.success("Review updated!");
        } else {
          const newPayload = {
            [targetColumn]: targetId,
            reviewer_phone: activePhone,
            rating: selectedRating,
            comment: trimmedComment,
          };

          const { data, error } = await supabase
            .from("reviews")
            .insert(newPayload as any)
            .select()
            .single();

          if (error) throw error;
          if (data) {
            reviewResultId = (data as ReviewItem).id;
            setMyExistingReview(data as ReviewItem);
          }
          toast.success("Review submitted! Thank you.");
        }
      }

      setDialogOpen(false);
      await loadReviews();
    } catch (err: any) {
      console.error("Error submitting review:", err);
      setErrorMessage(err?.message || "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Compute displayed summary
  const totalCount = reviews.length;
  const averageRating =
    totalCount > 0
      ? Number((reviews.reduce((acc, cur) => acc + cur.rating, 0) / totalCount).toFixed(1))
      : Number(initialRating ?? 0);

  return (
    <section className="rounded-2xl p-5 bg-white border border-border shadow-sm space-y-5">
      {/* Header & Rating Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">Reviews & Rating</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Verified ratings and feedback from local customers.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-muted/30 px-3.5 py-2 rounded-xl border border-border/50">
          <div className="flex items-center gap-1">
            <Star className="h-5 w-5 fill-amber-400 text-amber-500" />
            <span className="text-xl font-black text-foreground">
              {averageRating > 0 ? averageRating.toFixed(1) : "—"}
            </span>
          </div>
          <div className="h-6 w-px bg-border/80" />
          <span className="text-xs font-semibold text-muted-foreground">
            {totalCount === 0
              ? "No reviews yet"
              : `${totalCount} ${totalCount === 1 ? "review" : "reviews"}`}
          </span>
        </div>
      </div>

      {/* Role-Restricted & Contact-Verified Action Section */}
      {isCustomer ? (
        <div className="rounded-xl border border-border/70 bg-gradient-to-r from-muted/20 to-primary/5 p-4">
          {checkingContact ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Verifying customer eligibility...
            </div>
          ) : !hasContacted ? (
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-amber-950">
                  Contact this {targetType} first to leave a review
                </p>
                <p className="text-xs text-amber-800/80 mt-0.5">
                  To keep ratings honest and prevent spam, only customers who have contacted this{" "}
                  {targetType} via WhatsApp or Phone can share reviews.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {myExistingReview ? "You reviewed this " + targetType : "Share your experience"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {myExistingReview
                    ? `You gave ${myExistingReview.rating}★ rating. You can edit your review anytime.`
                    : "Help your neighborhood by rating service quality and reliability."}
                </p>
              </div>
              <Button
                onClick={openReviewModal}
                className="gap-2 shrink-0 font-semibold rounded-xl"
                variant={myExistingReview ? "outline" : "default"}
              >
                {myExistingReview ? (
                  <>
                    <Edit3 className="h-4 w-4" />
                    Edit Your Review
                  </>
                ) : (
                  <>
                    <MessageSquarePlus className="h-4 w-4" />
                    Leave a Review
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      ) : null}

      {/* Reviews List */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Recent Reviews {totalCount > 0 && `(${totalCount})`}
        </h4>

        {loading ? (
          <div className="py-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Loading reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/80 p-6 text-center">
            <Star className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">No reviews yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {isCustomer && !hasContacted
                ? `Connect with this ${targetType} using WhatsApp or Call above to share the first review!`
                : "Be the first verified customer to share feedback."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {reviews.map((rev) => (
              <div key={rev.id} className="py-3.5 first:pt-0 last:pb-0 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center text-amber-500">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3.5 w-3.5 ${
                            star <= rev.rating
                              ? "fill-amber-400 text-amber-500"
                              : "text-muted-foreground/20"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-foreground">
                      {formatReviewerLabel(rev.reviewer_phone)}
                    </span>
                  </div>

                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                    {formatShortRelativeTime(rev.created_at)}
                  </span>
                </div>

                {rev.comment && (
                  <p className="text-xs text-foreground/90 leading-relaxed pl-0.5">{rev.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Submission Modal (Customers Only) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>
              {myExistingReview ? "Edit Your Review" : `Review for ${targetName}`}
            </DialogTitle>
            <DialogDescription>
              Share your honest feedback. Your review will help other local customers make informed
              decisions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {errorMessage && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive">
                {errorMessage}
              </div>
            )}

            {/* Star Rating Picker */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Your Rating
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSelectedRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 hover:scale-110 transition-transform focus:outline-none"
                    aria-label={`Rate ${star} star`}
                  >
                    <Star
                      className={`h-7 w-7 transition-colors ${
                        star <= (hoverRating || selectedRating)
                          ? "fill-amber-400 text-amber-500"
                          : "text-muted-foreground/30 hover:text-muted-foreground/60"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm font-semibold text-foreground">
                  {RATING_LABELS[hoverRating || selectedRating] || ""}
                </span>
              </div>
            </div>

            {/* Optional Comment */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Comment (Optional)
                </label>
                <span className="text-[11px] text-muted-foreground">{comment.length} / 300</span>
              </div>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 300))}
                placeholder="What did you like? (Work quality, punctuality, pricing, behavior...)"
                rows={4}
                className="text-sm resize-none"
                maxLength={300}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmitReview}
              disabled={submitting || selectedRating < 1}
              className="gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {myExistingReview ? "Update Review" : "Submit Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
